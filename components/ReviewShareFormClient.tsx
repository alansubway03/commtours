"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type UploadedPhoto = { storagePath: string; publicUrl: string };
const MAX_UPLOAD_PHOTOS = 8;

type ShareTourSource = {
  id: string;
  agency: string;
  destination: string;
};

function RatingField({
  label,
  value,
  onChange,
  id,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  id: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>
        {label}（{value} 星）
      </Label>
      <select
        id={id}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        required
      >
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
      </select>
    </div>
  );
}

export function ReviewShareFormClient({ tours }: { tours: ShareTourSource[] }) {
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [message, setMessage] = useState("");

  const [agency, setAgency] = useState("");
  const [customAgency, setCustomAgency] = useState("");
  const [groupCode, setGroupCode] = useState("");
  const [countryCategory, setCountryCategory] = useState("歐洲");

  const [itineraryRating, setItineraryRating] = useState(5);
  const [mealRating, setMealRating] = useState(5);
  const [hotelRating, setHotelRating] = useState(5);
  const [guideRating, setGuideRating] = useState(5);
  const [valueRating, setValueRating] = useState(5);
  const [willRebook, setWillRebook] = useState("yes");
  const [comment, setComment] = useState("");
  const [baseFeeHkd, setBaseFeeHkd] = useState("0");
  const [optionalActivityFeeHkd, setOptionalActivityFeeHkd] = useState("0");
  const [staffServiceFeeHkd, setStaffServiceFeeHkd] = useState("0");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/member/me");
      const json = await res.json();
      setAuthenticated(Boolean(json.authenticated));
      setAuthChecked(true);
    })();
  }, []);

  const agencyOptions = useMemo(
    () => Array.from(new Set(tours.map((t) => t.agency).filter((x) => x.trim()))).sort((a, b) => a.localeCompare(b)),
    [tours]
  );

  async function uploadFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const remaining = MAX_UPLOAD_PHOTOS - photos.length;
    if (remaining <= 0) {
      setMessage(`最多只能上載 ${MAX_UPLOAD_PHOTOS} 張相片。`);
      return;
    }

    const selected = Array.from(fileList).slice(0, remaining);
    if (selected.length < fileList.length) {
      setMessage(`最多只能上載 ${MAX_UPLOAD_PHOTOS} 張，已自動略過多出的相片。`);
    }

    setUploadingPhotos(true);
    setMessage("");
    try {
      for (const file of selected) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/reviews/upload-photo", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) {
          setMessage(json.error ?? "上載照片失敗");
          break;
        }
        setPhotos((prev) => [...prev, { storagePath: json.storagePath, publicUrl: json.publicUrl }]);
      }
    } finally {
      setUploadingPhotos(false);
    }
  }

  function removePhoto(storagePath: string) {
    setPhotos((prev) => prev.filter((p) => p.storagePath !== storagePath));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    const selectedAgency = agency === "__other__" ? customAgency.trim() : agency.trim();
    if (!selectedAgency) {
      setMessage("請先選擇旅行社；若選「其他」，請輸入旅行社名稱。");
      return;
    }
    if (agency === "__other__" && selectedAgency.length < 2) {
      setMessage("請輸入至少 2 個字的旅行社名稱。");
      return;
    }

    const agencyTours = tours.filter((tour) => tour.agency.trim() === selectedAgency);
    const tourId = agencyTours[0]?.id ?? null;

    const normalizedGroupCode = groupCode.trim();
    if (!normalizedGroupCode) {
      setMessage("請填寫團號。");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agency: selectedAgency,
        tourId,
        itineraryRating,
        mealRating,
        hotelRating,
        guideRating,
        valueRating,
        willRebook: willRebook === "yes",
        comment,
        extraInfo: `[提交來源] ${selectedAgency} / ${countryCategory} / 團號 ${normalizedGroupCode}`,
        participationProof: `團號 ${normalizedGroupCode}`,
        destinationCategory: countryCategory,
        groupCode: normalizedGroupCode,
        baseFeeHkd: Number(baseFeeHkd || 0),
        optionalActivityFeeHkd: Number(optionalActivityFeeHkd || 0),
        staffServiceFeeHkd: Number(staffServiceFeeHkd || 0),
        photos,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(json.error ?? "提交失敗");
      return;
    }
    setMessage("分享已提交，待管理員審核後公開。");
    setGroupCode("");
    setComment("");
    setBaseFeeHkd("0");
    setOptionalActivityFeeHkd("0");
    setStaffServiceFeeHkd("0");
    setPhotos([]);
  }

  if (!authChecked) return null;

  if (!authenticated) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">分享行程</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            提交前請先到 <Link href="/member" className="underline">會員頁</Link> 註冊或登入。
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">分享行程</h2>
        <p className="text-sm text-muted-foreground">直接填表提交即可，不需要先選具體旅行團。</p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="agency">旅行社</Label>
              <select
                id="agency"
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={agency}
                onChange={(e) => {
                  const v = e.target.value;
                  setAgency(v);
                  if (v !== "__other__") setCustomAgency("");
                }}
                required
              >
                <option value="">請選擇</option>
                {agencyOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
                <option value="__other__">其他</option>
              </select>
              {agency === "__other__" ? (
                <div className="space-y-1 pt-2">
                  <Label htmlFor="custom-agency">請輸入旅行社名稱</Label>
                  <Input
                    id="custom-agency"
                    value={customAgency}
                    onChange={(e) => setCustomAgency(e.target.value)}
                    placeholder="例如：某某假期"
                    maxLength={120}
                    autoComplete="organization"
                    required
                  />
                  <p className="text-xs text-muted-foreground">請填寫正式／常用名稱，方便管理員審核。</p>
                </div>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="country-category">目的地</Label>
              <select
                id="country-category"
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={countryCategory}
                onChange={(e) => setCountryCategory(e.target.value)}
              >
                <option value="歐洲">歐洲</option>
                <option value="北美">北美</option>
                <option value="亞洲">亞洲</option>
                <option value="澳洲/紐西蘭">澳洲/紐西蘭</option>
                <option value="南美">南美</option>
                <option value="中東">中東</option>
                <option value="非洲">非洲</option>
                <option value="極地及郵輪">極地 及郵輪</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="group-code">團號</Label>
            <Input
              id="group-code"
              value={groupCode}
              onChange={(e) => setGroupCode(e.target.value)}
              placeholder="請輸入團號"
              required
            />
          </div>

          <RatingField id="itinerary-rating" label="行程" value={itineraryRating} onChange={setItineraryRating} />
          <RatingField id="meal-rating" label="膳食" value={mealRating} onChange={setMealRating} />
          <RatingField id="hotel-rating" label="住宿" value={hotelRating} onChange={setHotelRating} />
          <RatingField id="staff-rating" label="工作人員表現" value={guideRating} onChange={setGuideRating} />
          <RatingField id="value-rating" label="性價比" value={valueRating} onChange={setValueRating} />

          <div className="space-y-1">
            <Label htmlFor="will-rebook">會否再報此旅行社</Label>
            <select
              id="will-rebook"
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={willRebook}
              onChange={(e) => setWillRebook(e.target.value)}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="base-fee-hkd">團費（HKD）</Label>
              <Input
                id="base-fee-hkd"
                type="text"
                inputMode="decimal"
                value={baseFeeHkd}
                onChange={(e) => setBaseFeeHkd(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="optional-activity-fee-hkd">自費活動（HKD）</Label>
              <Input
                id="optional-activity-fee-hkd"
                type="text"
                inputMode="decimal"
                value={optionalActivityFeeHkd}
                onChange={(e) => setOptionalActivityFeeHkd(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="staff-service-fee-hkd">領隊導遊服務費（HKD）</Label>
              <Input
                id="staff-service-fee-hkd"
                type="text"
                inputMode="decimal"
                value={staffServiceFeeHkd}
                onChange={(e) => setStaffServiceFeeHkd(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1 rounded-md border p-3 text-sm">
              <p className="text-muted-foreground">總收費（HKD）</p>
              <p className="text-lg font-semibold">
                {(Number(baseFeeHkd || 0) + Number(optionalActivityFeeHkd || 0) + Number(staffServiceFeeHkd || 0)).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="comment">comment</Label>
            <textarea
              id="comment"
              className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photos">參團證明相片（最少 1 張）</Label>
            <div className="rounded-lg border border-dashed bg-muted/20 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  已上載 {photos.length} / {MAX_UPLOAD_PHOTOS} 張
                </p>
                <p className="text-xs text-muted-foreground">
                  {MAX_UPLOAD_PHOTOS - photos.length > 0
                    ? `尚可上載 ${MAX_UPLOAD_PHOTOS - photos.length} 張`
                    : "已達上限"}
                </p>
              </div>
              <Input
                id="photos"
                type="file"
                accept="image/*"
                multiple
                disabled={uploadingPhotos || photos.length >= MAX_UPLOAD_PHOTOS}
                onChange={(e) => void uploadFiles(e.target.files)}
                className="mt-2"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                建議先上載最清晰的參團證明，例如團隊合照，旅遊車前團號等等
              </p>
            </div>

            {photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {photos.map((photo, index) => (
                  <div key={photo.storagePath} className="overflow-hidden rounded-md border bg-background">
                    <img
                      src={photo.publicUrl}
                      alt={`參團證明相片 ${index + 1}`}
                      className="h-24 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.storagePath)}
                      className="w-full border-t px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                    >
                      移除
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <Button type="submit" disabled={loading || uploadingPhotos}>
            {loading ? "提交中..." : "提交分享"}
          </Button>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
