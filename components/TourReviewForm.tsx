"use client";

import { FormEvent, useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type UploadedPhoto = { storagePath: string; publicUrl: string };

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
      <Input
        id={id}
        type="number"
        min={1}
        max={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        required
      />
    </div>
  );
}

export function TourReviewForm({ tourId }: { tourId: string }) {
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [itineraryRating, setItineraryRating] = useState(5);
  const [mealRating, setMealRating] = useState(5);
  const [hotelRating, setHotelRating] = useState(5);
  const [guideRating, setGuideRating] = useState(5);
  const [willRebook, setWillRebook] = useState("yes");
  const [comment, setComment] = useState("");
  const [extraInfo, setExtraInfo] = useState("");
  const [participationProof, setParticipationProof] = useState("");
  const [baseFeeHkd, setBaseFeeHkd] = useState("0");
  const [optionalActivityFeeHkd, setOptionalActivityFeeHkd] = useState("0");
  const [staffServiceFeeHkd, setStaffServiceFeeHkd] = useState("0");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);

  useEffect(() => {
    void checkAuth();
  }, []);

  async function checkAuth() {
    const res = await fetch("/api/member/me");
    const json = await res.json();
    setAuthenticated(Boolean(json.authenticated));
    setAuthChecked(true);
  }

  async function uploadFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setLoading(true);
    setMessage("");
    try {
      for (const file of Array.from(fileList)) {
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
      setLoading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tourId,
        itineraryRating,
        mealRating,
        hotelRating,
        guideRating,
        willRebook: willRebook === "yes",
        comment,
        extraInfo,
        participationProof,
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
    setMessage("評分已提交，管理員審核通過後會於評價專頁公開，感謝分享！");
    setComment("");
    setExtraInfo("");
    setParticipationProof("");
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
          <h3 className="text-lg font-semibold">會員評分</h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            提交評分前請先到 <Link className="underline" href="/member">會員頁</Link> 註冊或登入。
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">提交此旅行團評分</h3>
        <p className="text-sm text-muted-foreground">
          必須提供參團證明與最少一張照片。提交後會由管理員審核，通過後才會在
          <Link className="mx-0.5 underline" href={`/tours/${tourId}/reviews`}>
            評價專頁
          </Link>
          公開顯示。
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={onSubmit}>
          <RatingField id="itinerary-rating" label="行程" value={itineraryRating} onChange={setItineraryRating} />
          <RatingField id="meal-rating" label="膳食" value={mealRating} onChange={setMealRating} />
          <RatingField id="hotel-rating" label="住宿" value={hotelRating} onChange={setHotelRating} />
          <RatingField id="guide-rating" label="工作人員表現" value={guideRating} onChange={setGuideRating} />

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

          <div className="space-y-1">
            <Label htmlFor="proof">參團證明（例如：團中照片拍攝地點、日期等）</Label>
            <textarea
              id="proof"
              className="min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={participationProof}
              onChange={(e) => setParticipationProof(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="base-fee-hkd">團費（HKD）</Label>
              <Input
                id="base-fee-hkd"
                type="number"
                min={0}
                step="0.01"
                value={baseFeeHkd}
                onChange={(e) => setBaseFeeHkd(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="optional-activity-fee-hkd">自費活動（HKD）</Label>
              <Input
                id="optional-activity-fee-hkd"
                type="number"
                min={0}
                step="0.01"
                value={optionalActivityFeeHkd}
                onChange={(e) => setOptionalActivityFeeHkd(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="staff-service-fee-hkd">領隊導遊服務費（HKD）</Label>
              <Input
                id="staff-service-fee-hkd"
                type="number"
                min={0}
                step="0.01"
                value={staffServiceFeeHkd}
                onChange={(e) => setStaffServiceFeeHkd(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1 rounded-md border p-3 text-sm">
              <p className="text-muted-foreground">總收費（HKD）</p>
              <p className="text-lg font-semibold">
                {(
                  Number(baseFeeHkd || 0) +
                  Number(optionalActivityFeeHkd || 0) +
                  Number(staffServiceFeeHkd || 0)
                ).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="comment">手寫 comment</Label>
            <textarea
              id="comment"
              className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="extra-info">額外資料</Label>
            <textarea
              id="extra-info"
              className="min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={extraInfo}
              onChange={(e) => setExtraInfo(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="photos">上載相片（最少 1 張）</Label>
            <Input id="photos" type="file" accept="image/*" multiple onChange={(e) => void uploadFiles(e.target.files)} />
            {photos.length > 0 ? (
              <p className="text-xs text-muted-foreground">已上載 {photos.length} 張</p>
            ) : null}
          </div>

          <Button type="submit" disabled={loading}>
            提交評分
          </Button>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
