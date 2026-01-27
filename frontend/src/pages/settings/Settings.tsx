import { Routes, Route, Navigate } from 'react-router-dom'
import SettingsLayout from '../../components/settings/SettingsLayout'
import LLMConfigurationPanel from '../../components/settings/LLMConfigurationPanel'
import LearningPreferencesPanel from '../../components/settings/LearningPreferencesPanel'
import NotificationSettingsPanel from '../../components/settings/NotificationSettingsPanel'
import PrivacySettingsPanel from '../../components/settings/PrivacySettingsPanel'
import SystemSettingsPanel from '../../components/settings/SystemSettingsPanel'
import DataManagementPanel from '../../components/settings/DataManagementPanel'
import { AccessibilitySettings } from '../../components/accessibility'

export default function Settings() {
  return (
    <SettingsLayout>
      <Routes>
        <Route path="/" element={<Navigate to="llm" replace />} />
        <Route path="llm" element={<LLMConfigurationPanel />} />
        <Route path="learning" element={<LearningPreferencesPanel />} />
        <Route path="notifications" element={<NotificationSettingsPanel />} />
        <Route path="privacy" element={<PrivacySettingsPanel />} />
        <Route path="accessibility" element={<AccessibilitySettings />} />
        <Route path="system" element={<SystemSettingsPanel />} />
        <Route path="data" element={<DataManagementPanel />} />
      </Routes>
    </SettingsLayout>
  )
}