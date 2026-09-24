import React, { useState, useEffect } from 'react';
import {
  AdminAccountRecord,
  getAdminAccounts,
  createAdminAccount,
  deleteAdminAccount,
  updateAdminAccountPassword,
} from '../../services/adminAuth';
import {
  Users,
  ShieldCheck,
  Plus,
  Trash2,
  Key,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';

interface AdminUsersTabProps {
  currentAdminEmail: string;
}

export function AdminUsersTab({ currentAdminEmail }: AdminUsersTabProps) {
  const [accounts, setAccounts] = useState<AdminAccountRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Admin Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'super_admin'>('admin');
  const [addStatus, setAddStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [adding, setAdding] = useState(false);

  // Change Password Modal State
  const [passwordModalUser, setPasswordModalUser] = useState<AdminAccountRecord | null>(null);
  const [userNewPassword, setUserNewPassword] = useState('');
  const [userConfirmPassword, setUserConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  // Delete Confirmation Modal State
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<AdminAccountRecord | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Global action notification
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const list = await getAdminAccounts();
      setAccounts(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddStatus(null);

    if (newPassword.length < 8) {
      setAddStatus({ success: false, message: 'Password must be at least 8 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setAddStatus({ success: false, message: 'Passwords do not match.' });
      return;
    }

    setAdding(true);
    try {
      const res = await createAdminAccount(newEmail, newPassword, newRole, currentAdminEmail);
      if (res.success) {
        setAddStatus({ success: true, message: 'Administrator created successfully.' });
        await fetchAccounts();
        setBannerNotice(`Created new administrator: ${newEmail.trim().toLowerCase()}`);
        setTimeout(() => {
          setShowAddModal(false);
          setNewEmail('');
          setNewPassword('');
          setConfirmPassword('');
          setAddStatus(null);
        }, 1200);
      } else {
        setAddStatus({ success: false, message: res.error || 'Failed to create administrator.' });
      }
    } catch {
      setAddStatus({ success: false, message: 'An error occurred creating account.' });
    } finally {
      setAdding(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser) return;
    setPasswordStatus(null);

    if (userNewPassword.length < 8) {
      setPasswordStatus({ success: false, message: 'Password must be at least 8 characters long.' });
      return;
    }

    if (userNewPassword !== userConfirmPassword) {
      setPasswordStatus({ success: false, message: 'Passwords do not match.' });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await updateAdminAccountPassword(passwordModalUser.email, userNewPassword);
      if (res.success) {
        setPasswordStatus({ success: true, message: 'Password updated successfully.' });
        setBannerNotice(`Updated password for ${passwordModalUser.email}`);
        setTimeout(() => {
          setPasswordModalUser(null);
          setUserNewPassword('');
          setUserConfirmPassword('');
          setPasswordStatus(null);
        }, 1200);
      } else {
        setPasswordStatus({ success: false, message: res.error || 'Failed to update password.' });
      }
    } catch {
      setPasswordStatus({ success: false, message: 'An error occurred updating password.' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirmUser) return;
    setDeleteError(null);
    setDeleting(true);

    try {
      const res = await deleteAdminAccount(deleteConfirmUser.email, currentAdminEmail);
      if (res.success) {
        setBannerNotice(`Removed administrator: ${deleteConfirmUser.email}`);
        await fetchAccounts();
        setDeleteConfirmUser(null);
      } else {
        setDeleteError(res.error || 'Failed to delete administrator.');
      }
    } catch {
      setDeleteError('An unexpected error occurred.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {bannerNotice && (
        <div className="p-3.5 rounded-xl bg-[#E9F8EF] dark:bg-[#1B233A] border border-[#16A34A]/30/40 text-xs text-[#131A2B] dark:text-[#F4F6F9] flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-[#16A34A] shrink-0" />
            <span className="font-semibold">{bannerNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerNotice(null)}
            className="text-[#16A34A] dark:text-[#16A34A] hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Safeguards Card */}
      <section className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="border-b border-[#E4E8EF] dark:border-[#1B233A] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#131A2B] dark:text-[#F4F6F9] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#2563EB]" />
              <span>Administrator Accounts Management</span>
            </h2>
            <p className="text-xs text-[#5B6577] dark:text-[#9AA5B8] mt-0.5">
              Strictly private internal accounts with elevated permissions. Public user registration is permanently disabled.
            </p>
          </div>

          <button
            type="button"
            id="add-admin-account-btn"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors shadow-2xs cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Administrator</span>
          </button>
        </div>

        {/* Security Policy Badge */}
        <div className="p-3.5 rounded-xl border border-blue-100 dark:border-blue-950/60 bg-blue-50/50 dark:bg-blue-950/20 text-xs text-[#131A2B] dark:text-[#F4F6F9] flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-blue-950 dark:text-blue-200">
              Zero-Public-Registration Policy
            </p>
            <p className="text-[11px] text-[#5B6577] dark:text-[#9AA5B8] leading-relaxed">
              New administrators can only be created by an authenticated administrator from this screen. Passwords are salted and hashed using PBKDF2 with SHA-256 before local persistence.
            </p>
          </div>
        </div>

        {/* Accounts Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E4E8EF] dark:border-[#1B233A] text-[11px] font-semibold text-[#5B6577] dark:text-[#9AA5B8] uppercase tracking-wider">
                <th className="py-2.5 px-3">Administrator</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Created</th>
                <th className="py-2.5 px-3">Last Login</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E8EF] dark:divide-[#1B233A] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#5B6577] dark:text-[#9AA5B8]">
                    Loading administrators...
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#5B6577] dark:text-[#9AA5B8]">
                    No administrator accounts registered.
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => {
                  const isSelf = acc.email.toLowerCase() === currentAdminEmail.toLowerCase();
                  return (
                    <tr
                      key={acc.id}
                      className="hover:bg-[#F4F6F9] dark:hover:bg-[#1B233A]/40 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950 text-[#2563EB] font-bold text-xs flex items-center justify-center">
                            {acc.email.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-[#131A2B] dark:text-[#F4F6F9] flex items-center gap-1.5">
                              <span>{acc.email}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#E9F8EF] text-[#16A34A] dark:bg-[#1B233A] dark:text-[#16A34A]">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#5B6577] dark:text-[#9AA5B8]">
                              Created by {acc.createdBy}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            acc.role === 'super_admin'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>{acc.role.replace('_', ' ')}</span>
                        </span>
                      </td>

                      <td className="py-3 px-3 text-[#5B6577] dark:text-[#9AA5B8] font-mono text-[11px]">
                        {new Date(acc.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-3 text-[#5B6577] dark:text-[#9AA5B8] text-[11px]">
                        {acc.lastLoginAt ? (
                          <span>{new Date(acc.lastLoginAt).toLocaleString()}</span>
                        ) : (
                          <span className="italic text-[#F59E0B] dark:text-[#F59E0B]">Never logged in</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setPasswordModalUser(acc);
                              setUserNewPassword('');
                              setUserConfirmPassword('');
                              setPasswordStatus(null);
                            }}
                            className="p-1.5 rounded-lg text-[#5B6577] hover:text-[#131A2B] dark:hover:text-[#F4F6F9] hover:bg-[#F4F6F9] dark:hover:bg-[#1B233A] transition-colors"
                            title="Change password"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={isSelf || accounts.length <= 1}
                            onClick={() => {
                              setDeleteConfirmUser(acc);
                              setDeleteError(null);
                            }}
                            className="p-1.5 rounded-lg text-[#5B6577] hover:text-[#DC2626] hover:bg-[#FEF2F2] dark:hover:bg-rose-950/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={
                              isSelf
                                ? 'Cannot delete your own account'
                                : accounts.length <= 1
                                ? 'Cannot delete the only administrator'
                                : 'Remove administrator'
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 1. Add Administrator Modal */}
      {showAddModal && (
        <div
          id="add-admin-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4E8EF] dark:border-[#1B233A] pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-[#131A2B] dark:text-[#F4F6F9]">
                  Provision Administrator Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-[#5B6577] hover:text-[#131A2B] dark:hover:text-[#F4F6F9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addStatus && (
              <div
                className={`p-2.5 rounded-lg text-xs ${
                  addStatus.success
                    ? 'bg-[#E9F8EF] text-[#16A34A] dark:bg-[#1B233A] dark:text-[#16A34A]'
                    : 'bg-[#FEF2F2] text-[#DC2626] dark:bg-[#1B233A] dark:text-[#DC2626]'
                }`}
              >
                {addStatus.message}
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-[#131A2B] dark:text-[#F4F6F9]">
                  Administrator Email
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="editor@onlinetools.internal"
                  className="w-full p-2.5 rounded-lg bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[#131A2B] dark:text-[#F4F6F9]">
                  Permission Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole('admin')}
                    className={`p-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                      newRole === 'admin'
                        ? 'border-[#2563EB] bg-blue-50 text-[#2563EB] dark:bg-blue-950 dark:text-blue-300'
                        : 'border-[#E4E8EF] dark:border-[#1B233A] text-[#5B6577] dark:text-[#9AA5B8]'
                    }`}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRole('super_admin')}
                    className={`p-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                      newRole === 'super_admin'
                        ? 'border-[#2563EB] bg-blue-50 text-[#2563EB] dark:bg-blue-950 dark:text-blue-300'
                        : 'border-[#E4E8EF] dark:border-[#1B233A] text-[#5B6577] dark:text-[#9AA5B8]'
                    }`}
                  >
                    Super Admin
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[#131A2B] dark:text-[#F4F6F9]">
                  Initial Password (min 8 chars)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full p-2.5 rounded-lg bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[#131A2B] dark:text-[#F4F6F9]">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full p-2.5 rounded-lg bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-[#5B6577] dark:text-[#9AA5B8] hover:bg-[#F4F6F9] dark:hover:bg-[#1B233A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8] disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {adding ? 'Creating...' : 'Create Administrator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Change Password Modal */}
      {passwordModalUser && (
        <div
          id="change-password-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4E8EF] dark:border-[#1B233A] pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-[#131A2B] dark:text-[#F4F6F9]">
                  Change Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalUser(null)}
                className="p-1 text-[#5B6577] hover:text-[#131A2B] dark:hover:text-[#F4F6F9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5B6577] dark:text-[#9AA5B8]">
              Target Account: <span className="font-semibold text-[#131A2B] dark:text-[#F4F6F9]">{passwordModalUser.email}</span>
            </p>

            {passwordStatus && (
              <div
                className={`p-2.5 rounded-lg text-xs ${
                  passwordStatus.success
                    ? 'bg-[#E9F8EF] text-[#16A34A] dark:bg-[#1B233A] dark:text-[#16A34A]'
                    : 'bg-[#FEF2F2] text-[#DC2626] dark:bg-[#1B233A] dark:text-[#DC2626]'
                }`}
              >
                {passwordStatus.message}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-[#5B6577] dark:text-[#9AA5B8]">
                  New Password (min 8 chars)
                </label>
                <input
                  type="password"
                  required
                  value={userNewPassword}
                  onChange={(e) => setUserNewPassword(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[#5B6577] dark:text-[#9AA5B8]">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={userConfirmPassword}
                  onChange={(e) => setUserConfirmPassword(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-[#5B6577] dark:text-[#9AA5B8] hover:bg-[#F4F6F9] dark:hover:bg-[#1B233A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8] disabled:opacity-50 cursor-pointer"
                >
                  {savingPassword ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div
          id="delete-admin-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-[#DC2626] dark:text-[#DC2626]">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-[#131A2B] dark:text-[#F4F6F9]">
                Revoke Administrator Privileges?
              </h3>
            </div>

            <p className="text-xs text-[#5B6577] dark:text-[#9AA5B8] leading-relaxed">
              Are you sure you want to permanently revoke access for{' '}
              <span className="font-bold text-[#131A2B] dark:text-[#F4F6F9]">
                {deleteConfirmUser.email}
              </span>
              ? This user will immediately lose access to all admin capabilities.
            </p>

            {deleteError && (
              <div className="p-2.5 rounded-lg text-xs bg-[#FEF2F2] text-[#DC2626] dark:bg-[#1B233A] dark:text-[#DC2626]">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs text-[#5B6577] dark:text-[#9AA5B8] hover:bg-[#F4F6F9] dark:hover:bg-[#1B233A]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {deleting ? 'Revoking...' : 'Confirm Revocation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
