import { useState } from "react";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AccessPanel } from "@/components/settings/AccessPanel";
import { LanguageCard } from "@/components/settings/LanguagePicker";
import { ThemeCard } from "@/components/settings/ThemePicker";
import { ChangePasswordCard, SessionsCard, TwoFactorCard } from "@/components/settings/SecurityPanels";
import { useUserProfile, type UserProfile } from "@/context/UserProfileContext";
import { ApiError } from "@/lib/api";
import { tr } from "@/i18n";

export default function Settings() {
  const { profile, updateProfile, notifications, setNotifications, initials } = useUserProfile();
  const [draft, setDraft] = useState<UserProfile>(profile);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function saveProfile() {
    setSaveError("");
    try {
      await updateProfile(draft);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : tr("set.saveFailed"));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-text">{tr("nav.settings")}</h1>
        <p className="text-xs text-text-secondary">{tr("set.subtitle")}</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">{tr("set.tab.profile")}</TabsTrigger>
          <TabsTrigger value="notifications">{tr("set.tab.notifications")}</TabsTrigger>
          <TabsTrigger value="security">{tr("set.tab.security")}</TabsTrigger>
          <TabsTrigger value="access">{tr("set.tab.access")}</TabsTrigger>
          <TabsTrigger value="appearance">{tr("set.tab.appearance")}</TabsTrigger>
        </TabsList>

        {/* PROFILE */}
        <TabsContent value="profile">
          <div className="flex flex-col gap-4">
            <Card className="max-w-xl">
              <CardHeader><CardTitle>{tr("set.profile.title")}</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-border-strong bg-panel-hover text-lg font-semibold text-cyan-300">
                    {initials}
                  </div>
                  <p className="text-xs text-text-muted">{tr("set.profile.avatar")}</p>
                </div>

                <Separator />

                <div>
                  <Label className="mb-1.5 block">{tr("set.profile.fullName")}</Label>
                  <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1.5 block">{tr("set.profile.badge")}</Label>
                    <Input value={draft.badge} onChange={(e) => setDraft({ ...draft, badge: e.target.value })} />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">{tr("set.profile.department")}</Label>
                    <Input value={draft.department} onChange={(e) => setDraft({ ...draft, department: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5 block">{tr("set.profile.email")}</Label>
                  <Input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
                </div>

                <div className="flex items-center gap-3">
                  <Button onClick={saveProfile}>{saved ? <><Check size={14} /> {tr("set.profile.saved")}</> : tr("set.profile.save")}</Button>
                  {saved && <span className="text-xs text-green">{tr("set.profile.updated")}</span>}
                  {saveError && <span role="alert" className="text-xs text-red">{saveError}</span>}
                </div>
              </CardContent>
            </Card>

            <LanguageCard />
          </div>
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="notifications">
          <Card className="max-w-xl">
            <CardHeader><CardTitle>{tr("set.notif.title")}</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-1">
              <ToggleRow
                label={tr("set.notif.critical")}
                description={tr("set.notif.criticalDesc")}
                checked={notifications.criticalAlerts}
                onChange={(v) => setNotifications({ ...notifications, criticalAlerts: v })}
              />
              <ToggleRow
                label={tr("set.notif.high")}
                description={tr("set.notif.highDesc")}
                checked={notifications.highAlerts}
                onChange={(v) => setNotifications({ ...notifications, highAlerts: v })}
              />
              <ToggleRow
                label={tr("set.notif.medium")}
                description={tr("set.notif.mediumDesc")}
                checked={notifications.mediumAlerts}
                onChange={(v) => setNotifications({ ...notifications, mediumAlerts: v })}
              />
              <Separator className="my-2" />
              <ToggleRow
                label={tr("set.notif.caseUpdates")}
                description={tr("set.notif.caseUpdatesDesc")}
                checked={notifications.caseUpdates}
                onChange={(v) => setNotifications({ ...notifications, caseUpdates: v })}
              />
              <ToggleRow
                label={tr("set.notif.evidence")}
                description={tr("set.notif.evidenceDesc")}
                checked={notifications.evidenceProcessed}
                onChange={(v) => setNotifications({ ...notifications, evidenceProcessed: v })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECURITY */}
        <TabsContent value="security">
          <div className="flex max-w-xl flex-col gap-4">
            <ChangePasswordCard />
            <TwoFactorCard />
            <SessionsCard />
          </div>
        </TabsContent>

        {/* ACCESS LEVEL */}
        <TabsContent value="access">
          <AccessPanel />
        </TabsContent>

        {/* APPEARANCE */}
        <TabsContent value="appearance">
          <ThemeCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="text-xs font-medium text-text">{label}</p>
        <p className="text-[11px] text-text-muted">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
