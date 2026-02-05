import { useState } from 'react'

function TeamWorkspaceModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('members')

  if (!isOpen) return null

  // Mock team data
  const mockTeamMembers = [
    { id: 1, name: 'Sarah Johnson', email: 'sarah@company.com', role: 'Owner', avatar: 'SJ', color: 'bg-blue-500' },
    { id: 2, name: 'Michael Chen', email: 'michael@company.com', role: 'Admin', avatar: 'MC', color: 'bg-green-500' },
    { id: 3, name: 'Emily Rodriguez', email: 'emily@company.com', role: 'Member', avatar: 'ER', color: 'bg-purple-500' },
    { id: 4, name: 'David Kim', email: 'david@company.com', role: 'Member', avatar: 'DK', color: 'bg-orange-500' }
  ]

  const mockPermissions = [
    { id: 1, name: 'Create Conversations', enabled: true, description: 'Allow team members to create new conversations' },
    { id: 2, name: 'Share Conversations', enabled: true, description: 'Allow sharing conversations outside the team' },
    { id: 3, name: 'Delete Conversations', enabled: false, description: 'Allow permanent deletion of conversations' },
    { id: 4, name: 'Manage Projects', enabled: true, description: 'Create and modify team projects' },
    { id: 5, name: 'Invite Members', enabled: false, description: 'Send invitations to new team members' }
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-workspace-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 id="team-workspace-title" className="text-2xl font-semibold text-gray-900 dark:text-white">
              Team Workspace
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Collaborate with your team (Coming Soon)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-claude-orange"
            aria-label="Close team workspace modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Coming Soon Banner */}
        <div className="mx-6 mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                Team Features Coming Soon!
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                Team collaboration features are currently in development. The UI below shows what you can expect when this feature launches.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 mt-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('members')}
              className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'members'
                  ? 'border-claude-orange text-claude-orange'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Team Members
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'permissions'
                  ? 'border-claude-orange text-claude-orange'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Permissions
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Team Members ({mockTeamMembers.length})
                </h3>
                <button
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed"
                  disabled
                  title="Available when feature launches"
                >
                  <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Invite Member
                </button>
              </div>

              {/* Team Members List */}
              <div className="space-y-3">
                {mockTeamMembers.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full ${member.color} flex items-center justify-center text-white font-semibold text-lg flex-shrink-0`}>
                      {member.avatar}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {member.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {member.email}
                      </div>
                    </div>

                    {/* Role */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        member.role === 'Owner' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                        member.role === 'Admin' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {member.role}
                      </span>

                      {member.role !== 'Owner' && (
                        <button
                          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 opacity-50 cursor-not-allowed"
                          disabled
                          title="Available when feature launches"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Team Permissions
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Configure what team members can do in this workspace
                </p>
              </div>

              {/* Permissions List */}
              <div className="space-y-3">
                {mockPermissions.map(permission => (
                  <div
                    key={permission.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    {/* Toggle (disabled) */}
                    <button
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-not-allowed ${
                        permission.enabled
                          ? 'bg-gray-400 dark:bg-gray-600'
                          : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                      disabled
                      title="Available when feature launches"
                      role="switch"
                      aria-checked={permission.enabled}
                      aria-label={`Toggle ${permission.name}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          permission.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {permission.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                        {permission.description}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      permission.enabled
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {permission.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Preview of upcoming team features
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-claude-orange hover:bg-claude-orange-dark text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-claude-orange focus:ring-offset-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default TeamWorkspaceModal
