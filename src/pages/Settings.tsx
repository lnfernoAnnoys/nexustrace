import { useState } from "react";
import { Check, KeyRound, Laptop, Monitor, Shield, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useUserProfile, type UserProfile } from "@/context/UserProfileContext";

export default function Settings() {
  const { profile, setProfile, notifications, setNotifications, initials } = useUserProfile();
  const [draft, setDraft] = useState<UserProfile>(profile);
  const [saved, setSaved] = useState(false);

  function saveProfile() {
    setProfile(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-text">Settings</h1>
        <p className="text-xs text-text-secondary">Manage your investigator profile and workspace preferences</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        {/* PROFILE */}
        <TabsContent value="profile">
          <Card className="max-w-xl">
            <CardHeader><CardTitle>Investigator Profile</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-border-strong bg-panel-hover text-lg font-semibold text-cyan-300">
                  {initials}
                </div>
                <p className="text-xs text-text-muted">Avatar initials are generated automatically from your name.</p>
              </div>

              <Separator />

              <div>
                <Label className="mb-1.5 block">Full Name</Label>
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1.5 block">Badge / ID</Label>
                  <Input value={draft.badge} onChange={(e) => setDraft({ ...draft, badge: e.target.value })} />
                </div>
                <div>
                  <Label className="mb-1.5 block">Department</Label>
                  <Input value={draft.department} onChange={(e) => setDraft({ ...draft, department: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block">Email</Label>
                <Input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={saveProfile}>{saved ? <><Check size={14} /> Saved</> : "Save Changes"}</Button>
                {saved && <span className="text-xs text-green">Profile updated across the workspace</span>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="notifications">
          <Card className="max-w-xl">
            <CardHeader><CardTitle>Alert Notifications</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-1">
              <ToggleRow
                label="Critical severity alerts"
                description="Cross-case bridges, circular transactions, and other critical AI findings"
                checked={notifications.criticalAlerts}
                onChange={(v) => setNotifications({ ...notifications, criticalAlerts: v })}
              />
              <ToggleRow
                label="High severity alerts"
                description="Unusual call/movement patterns and other high-priority findings"
                checked={notifications.highAlerts}
                onChange={(v) => setNotifications({ ...notifications, highAlerts: v })}
              />
              <ToggleRow
                label="Medium severity alerts"
                description="Lower-confidence or exploratory pattern detections"
                checked={notifications.mediumAlerts}
                onChange={(v) => setNotifications({ ...notifications, mediumAlerts: v })}
              />
              <Separator className="my-2" />
              <ToggleRow
                label="Case updates"
                description="New events, status changes, and entity additions on cases you're assigned to"
                checked={notifications.caseUpdates}
                onChange={(v) => setNotifications({ ...notifications, caseUpdates: v })}
              />
              <ToggleRow
                label="Evidence processing complete"
                description="When AI extraction finishes on an uploaded document"
                checked={notifications.evidenceProcessed}
                onChange={(v) => setNotifications({ ...notifications, evidenceProcessed: v })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECURITY */}
        <TabsContent value="security">
          <div className="flex max-w-xl flex-col gap-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-1.5"><KeyRound size={14} className="text-cyan-400" /> Change Password</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div>
                  <Label className="mb-1.5 block">Current Password</Label>
                  <Input type="password" placeholder="••••••••••" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1.5 block">New Password</Label>
                    <Input type="password" placeholder="••••••••••" />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Confirm Password</Label>
                    <Input type="password" placeholder="••••••••••" />
                  </div>
                </div>
                <Button className="w-fit">Update Password</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-1.5"><Shield size={14} className="text-cyan-400" /> Two-Factor Authentication</CardTitle></CardHeader>
              <CardContent>
                <ToggleRow
                  label="Require 2FA on sign-in"
                  description="Adds an authenticator app code as a second factor, as required for MHA restricted-access systems"
                  checked={true}
                  onChange={() => {}}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Active Sessions</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-2">
                <SessionRow icon={Monitor} device="Windows · Chrome" location="Delhi, IN" active />
                <SessionRow icon={Smartphone} device="Android · NexusTrace Mobile" location="Gurugram, IN" />
                <SessionRow icon={Laptop} device="macOS · Chrome" location="Mumbai, IN" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* APPEARANCE */}
        <TabsContent value="appearance">
          <Card className="max-w-xl">
            <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <Label className="mb-2 block">Theme</Label>
                <div className="flex items-center gap-2 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2.5">
                  <span className="size-2 rounded-full bg-cyan-400" />
                  <span className="text-sm text-text">Dark — Intelligence Mode</span>
                  <Badge variant="outline" className="ml-auto">Locked</Badge>
                </div>
                <p className="mt-1.5 text-[11px] text-text-muted">
                  NexusTrace is standardized on the dark ops-room theme across all investigator workstations.
                </p>
              </div>
            </CardContent>
          </Card>
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

function SessionRow({
  icon: Icon,
  device,
  location,
  active,
}: {
  icon: typeof Monitor;
  device: string;
  location: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-panel-hover/30 px-3 py-2.5">
      <Icon size={15} className="shrink-0 text-text-muted" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-text">{device}</p>
        <p className="text-[10px] text-text-muted">{location}</p>
      </div>
      {active && <Badge variant="green">This device</Badge>}
    </div>
  );
}
