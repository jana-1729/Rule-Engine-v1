import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/components/card';
import { AccountSettingsForm } from '@/ui/dashboard/account-settings-form';
import { PasswordChangeForm } from '@/ui/dashboard/password-change-form';

export default async function SettingsPage() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  // Fetch account and user details
  const [account, user] = await Promise.all([
    prisma.account.findUnique({
      where: { id: session.accountId },
    }),
    prisma.accountUser.findUnique({
      where: { id: session.userId },
    }),
  ]);

  if (!account || !user) {
    return null;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account and preferences
        </p>
      </div>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountSettingsForm account={account} user={user} />
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordChangeForm />
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
            Delete Account
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

