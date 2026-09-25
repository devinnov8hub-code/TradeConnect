import { useEffect, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import BuyerLayout from "../components/BuyerLayout";
import Avatar from "../components/Avatar";
import {
  changePassword,
  getCurrentUser,
  removeAvatar,
  updateProfile,
} from "../lib/services/auth.service";
import type { AuthUser } from "../lib/types/auth";
import { getErrorMessage } from "../lib/getErrorMessage";
import { lgasByState, nigerianStates } from "../lib/data/nigeria-lgas";

const emptyProfile = {
  name: "",
  email: "",
  phone_number: "",
  state: "",
  lga: "",
  address: "",
};

export default function Settings() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profile, setProfile] = useState(emptyProfile);
  const [password, setPassword] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyUser = (response: AuthUser) => {
    setUser(response);
    setProfile({
      name: response.name ?? "",
      email: response.email ?? "",
      phone_number: response.phone_number ?? "",
      state: response.state ?? "",
      lga: response.lga ?? "",
      address: response.address ?? "",
    });
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await getCurrentUser();
        applyUser(response);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const updateField =
    (field: keyof typeof profile) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setProfile((prev) => ({
        ...prev,
        [field]: e.target.value,
        ...(field === "state" ? { lga: "" } : {}),
      }));

  const updatePassword =
    (field: keyof typeof password) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setPassword((prev) => ({ ...prev, [field]: e.target.value }));

  const discardChanges = () => {
    if (user) applyUser(user);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await updateProfile({
        name: profile.name,
        email: profile.email,
        phone_number: profile.phone_number || null,
        state: profile.state || null,
        lga: profile.lga || null,
        address: profile.address || null,
      });
      applyUser(response);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const response = await updateProfile({ avatar: file });
      applyUser(response);
      toast.success("Profile photo updated");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    setUploadingPhoto(true);
    try {
      const response = await removeAvatar();
      applyUser(response);
      toast.success("Profile photo removed");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleChangePassword = async () => {
    if (!password.current || !password.next) {
      toast.error("Enter your current and new password.");
      return;
    }
    if (password.next !== password.confirm) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword({
        current_password: password.current,
        new_password: password.next,
      });
      setPassword({ current: "", next: "", confirm: "" });
      toast.success("Password changed successfully");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <BuyerLayout breadcrumb="Settings / Buyer">
      <ToastContainer />
      <div className="flex flex-col gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Profile &amp; Account
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage your profile and account information.
          </p>

          <div className="mt-5 flex items-center gap-4">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={profile.name || "Profile photo"}
                className="h-16 w-16 shrink-0 rounded-full object-cover"
              />
            ) : (
              <Avatar name={profile.name || "B"} size="lg" />
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelected}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto || loading}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploadingPhoto ? "Uploading..." : "Change Photo"}
            </button>
            {user?.avatar_url && (
              <button
                onClick={handleRemovePhoto}
                disabled={uploadingPhoto || loading}
                className="text-sm font-medium text-rose-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                Full Name
              </label>
              <input
                value={profile.name}
                onChange={updateField("name")}
                disabled={loading}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none disabled:opacity-60"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                Buyer ID
              </label>
              <input
                value={user?.account_code ?? ""}
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-400"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                Email Address
              </label>
              <input
                value={profile.email}
                onChange={updateField("email")}
                disabled={loading}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none disabled:opacity-60"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                Phone Number
              </label>
              <input
                value={profile.phone_number}
                onChange={updateField("phone_number")}
                disabled={loading}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none disabled:opacity-60"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                State
              </label>
              <select
                value={profile.state}
                onChange={updateField("state")}
                disabled={loading}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none disabled:opacity-60"
              >
                <option value="">Select state</option>
                {nigerianStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                LGA
              </label>
              <select
                value={profile.lga}
                onChange={updateField("lga")}
                disabled={loading}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none disabled:opacity-60"
              >
                <option value="">
                  {profile.state ? "Select LGA" : "Select a state first"}
                </option>
                {(
                  lgasByState[profile.state as keyof typeof lgasByState] ?? []
                ).map((lga) => (
                  <option key={lga} value={lga}>
                    {lga}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                Address
              </label>
              <input
                value={profile.address}
                onChange={updateField("address")}
                disabled={loading}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Change Password
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                Current Password
              </label>
              <input
                type="password"
                value={password.current}
                onChange={updatePassword("current")}
                placeholder="Current password"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none"
              />
            </div>
            <div />
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                New Password
              </label>
              <input
                type="password"
                value={password.next}
                onChange={updatePassword("next")}
                placeholder="New password"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                Confirm New Password
              </label>
              <input
                type="password"
                value={password.confirm}
                onChange={updatePassword("confirm")}
                placeholder="Confirm new password"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {changingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={discardChanges}
            disabled={saving || loading}
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Discard Changes
          </button>
          <button
            onClick={handleSaveProfile}
            disabled={saving || loading}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </BuyerLayout>
  );
}
