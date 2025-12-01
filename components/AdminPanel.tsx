
import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { User } from '../types';
import SubscriptionCountdown from './SubscriptionCountdown';
import ResetPasswordModal from './ResetPasswordModal';
import ToggleAdminModal from './ToggleAdminModal';
import { ThemeSelector } from './creativestudio/ThemeSelector';

interface AdminPanelProps {
  currentUser: User;
  users: User[];
  onGrant: (uid: string, days: number) => void;
  onAddCredits: (uid: string, amount: number) => void;
  onResetPassword: (email: string) => Promise<void>;
  onToggleAdmin: (uid: string) => void;
  theme: string;
  setTheme: (theme: string) => void;
}

// Re-implement the decode function locally for this component to use.
const decodeCredentials = (encoded: string): string => {
    try {
      const base64Decoded = atob(encoded);
      return base64Decoded.split('').reverse().join('');
    } catch (e) { return ''; }
};

const UserRow: React.FC<{ 
    user: User; 
    currentUser: User;
    onGrant: (uid: string, days: number) => void; 
    onAddCredits: (uid: string, amount: number) => void;
    onRequestReset: (user: User) => void;
    onRequestToggleAdmin: (user: User) => void;
}> = ({ user, currentUser, onGrant, onAddCredits, onRequestReset, onRequestToggleAdmin }) => {
    const { t } = useTranslation();
    const isEffectivelyAdmin = new Date(user.subscriptionEndDate).getFullYear() > 9000;
    const superAdminUsername = decodeCredentials('b2tveUs=');

    const handleGrant30 = () => onGrant(user.uid, 30);
    const handleGrant365 = () => onGrant(user.uid, 365);
    const handleAdd100Credits = () => onAddCredits(user.uid, 100);
    const handleAdd500Credits = () => onAddCredits(user.uid, 500);
    const handleReset = () => onRequestReset(user);
    const handleToggle = () => onRequestToggleAdmin(user);
    
    // FIX: Changed from exact match (===) to includes() for more robust super admin protection.
    const isActionDisabled = user.username.toLowerCase().includes(superAdminUsername.toLowerCase()) || user.uid === currentUser.uid;
    
    const actionDisabledTitle = user.uid === currentUser.uid 
        ? t('errors.cannotChangeOwnAdmin')
        : t('errors.cannotChangeSuperAdmin');

    return (
        <tr className={`border-b border-white/10 ${user.isAdmin ? 'bg-blue-900/20' : 'hover:bg-white/5'}`}>
            <td className="p-3 font-medium">
                {user.username}
                {/* Display Short ID */}
                <div className="text-xs text-gray-400 font-mono">ID: {user.shortId || 'N/A'}</div>
                <div className="text-xs text-yellow-400 mt-1"><i className="fas fa-coins"></i> {user.credits || 0} Credits</div>
            </td>
            <td className="p-3">{new Date(user.subscriptionEndDate).toLocaleDateString(t('common.locale'))}</td>
            <td className="p-3 font-semibold">
                {isEffectivelyAdmin ? (
                    <span className="text-purple-400">{t('admin.adminStatus')}</span>
                ) : (
                    <SubscriptionCountdown endDateString={user.subscriptionEndDate} />
                )}
            </td>
            <td className="p-3 text-center">
                 <button 
                    onClick={handleToggle}
                    disabled={isActionDisabled}
                    title={isActionDisabled ? actionDisabledTitle : (user.isAdmin ? t('admin.revokeAdmin') : t('admin.grantAdmin'))}
                    className={`text-white text-xs font-bold py-1 px-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        user.isAdmin ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                    {user.isAdmin ? t('admin.revoke') : t('admin.grant')}
                </button>
            </td>
            <td className="p-3 text-right">
                {user.isAdmin && user.username.toLowerCase().includes(superAdminUsername.toLowerCase()) ? (
                     <span className="text-sm text-gray-500">{t('admin.notApplicable')}</span>
                ) : (
                    <div className="flex flex-col gap-2 items-end">
                        {!user.isAdmin && (
                            <div className="flex gap-2">
                                <button onClick={handleGrant30} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded transition-colors">{t('admin.add30days')}</button>
                                <button onClick={handleGrant365} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded transition-colors">{t('admin.add365days')}</button>
                            </div>
                        )}
                        <div className="flex gap-2">
                             <button onClick={handleAdd100Credits} className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-bold py-1 px-2 rounded transition-colors">+100 Cr</button>
                             <button onClick={handleAdd500Credits} className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold py-1 px-2 rounded transition-colors">+500 Cr</button>
                             <button onClick={handleReset} className="btn-secondary text-xs font-bold py-1 px-2 rounded">{t('admin.resetPassword')}</button>
                        </div>
                    </div>
                )}
            </td>
        </tr>
    );
};

// --- SIMULATOR COMPONENT ---
const PaymentSimulator = () => {
    const { t } = useTranslation();
    const [simContent, setSimContent] = useState('');
    const [simLoading, setSimLoading] = useState(false);
    const [simResult, setSimResult] = useState('');

    const handleSimulate = async () => {
        if (!simContent) return;
        setSimLoading(true);
        setSimResult('');
        
        try {
            const response = await fetch('/api/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: simContent,
                    amount: 50000 // Dummy amount
                })
            });
            const data = await response.json();
            if (response.ok) {
                setSimResult(`✅ Success: ${data.message} (${data.user})`);
            } else {
                setSimResult(`❌ Error: ${data.error}`);
            }
        } catch (e: any) {
            setSimResult(`❌ Error: ${e.message}`);
        } finally {
            setSimLoading(false);
        }
    };

    return (
        <div className="bg-[#1C2128] rounded-lg shadow-xl border border-white/10 p-6 mb-6">
            <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                <i className="fas fa-university"></i>
                {t('admin.simulator.title')}
            </h3>
            <p className="text-sm text-gray-400 mb-4">{t('admin.simulator.description')}</p>
            
            <div className="flex gap-4">
                <input 
                    type="text" 
                    value={simContent}
                    onChange={(e) => setSimContent(e.target.value)}
                    placeholder="VD: PHOTO A1B2C3 C100"
                    className="flex-grow bg-[#0D1117] border border-gray-600 rounded p-2 text-white font-mono"
                />
                <button 
                    onClick={handleSimulate} 
                    disabled={simLoading || !simContent}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                >
                    {simLoading ? t('common.processing') : t('admin.simulator.send')}
                </button>
            </div>
            {simResult && (
                <div className={`mt-3 text-sm font-mono p-2 rounded ${simResult.startsWith('✅') ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                    {simResult}
                </div>
            )}
        </div>
    );
};


const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, users, onGrant, onAddCredits, onResetPassword, onToggleAdmin, theme, setTheme }) => {
  const { t } = useTranslation();
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [userToToggleAdmin, setUserToToggleAdmin] = useState<User | null>(null);

  const handleRequestReset = useCallback((user: User) => {
    setUserToReset(user);
  }, []);
  
  const handleRequestToggleAdmin = useCallback((user: User) => {
    setUserToToggleAdmin(user);
  }, []);

  const handleCloseModal = useCallback(() => {
    setUserToReset(null);
    setUserToToggleAdmin(null);
  }, []);

  return (
    <div className="bg-[#0D1117] text-white min-h-full font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-[#79C0FF]">{t('admin.title')}</h1>
           <div>
              <ThemeSelector currentTheme={theme} onChangeTheme={setTheme} />
            </div>
        </header>

        {/* SIMULATOR */}
        <PaymentSimulator />

        <div className="bg-[#1C2128] rounded-lg shadow-xl overflow-hidden border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-[#E6EDF3]">
              <thead className="text-xs text-[#848D97] uppercase bg-black/20">
                <tr>
                  <th scope="col" className="p-3">{t('admin.table.username')}</th>
                  <th scope="col" className="p-3">{t('admin.table.expiryDate')}</th>
                  <th scope="col" className="p-3">{t('admin.table.status')}</th>
                  <th scope="col" className="p-3 text-center">{t('admin.table.adminRights')}</th>
                  <th scope="col" className="p-3 text-right">{t('admin.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map(user => 
                    <UserRow 
                        key={user.uid} 
                        user={user} 
                        currentUser={currentUser}
                        onGrant={onGrant}
                        onAddCredits={onAddCredits}
                        onRequestReset={handleRequestReset}
                        onRequestToggleAdmin={handleRequestToggleAdmin}
                    />
                  )
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center p-6 text-[#848D97]">{t('admin.noUsersFound')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
         <footer className="text-center text-[#6E7681] mt-8 text-sm">
            <p>{t('admin.footerNote')}</p>
        </footer>
      </div>
      <ResetPasswordModal 
        user={userToReset}
        onClose={handleCloseModal}
        onReset={onResetPassword}
      />
      <ToggleAdminModal
        user={userToToggleAdmin}
        onClose={handleCloseModal}
        onConfirm={onToggleAdmin}
      />
    </div>
  );
};

export default AdminPanel;
