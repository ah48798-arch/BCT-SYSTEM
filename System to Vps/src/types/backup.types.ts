/**
 * BCT Enterprise — Backup & Restore Types and Interfaces
 */

export type BackupType = 'automatic' | 'manual' | 'safety_pre_restore';
export type BackupDestination = 'local' | 'google_drive' | 'both' | 'local_computer' | 'server' | 'server_storage' | 'multi';
export type BackupStatus = 'completed' | 'in_progress' | 'failed';
export type BackupFrequency = 'daily' | 'weekly' | 'monthly' | 'manual';

export interface DestinationLocalComputerConfig {
  enabled: boolean;
  path: string; // Real Windows directory path e.g. "C:\BCT Backups"
  agent_status?: 'connected' | 'disconnected' | 'connecting' | 'error';
  free_space?: string;
}

export interface DestinationServerStorageConfig {
  enabled: boolean;
  path: string; // Server directory e.g. "./backups"
}

export interface DestinationGoogleDriveConfig {
  enabled: boolean;
  folder_id: string;
  folder_name: string;
  account_email?: string;
}

export interface BackupDestinationsConfig {
  local_computer: DestinationLocalComputerConfig;
  server_storage: DestinationServerStorageConfig;
  google_drive: DestinationGoogleDriveConfig;
}

export interface LocalAgentDriveInfo {
  drive: string;
  root: string;
  freeBytes: number;
  freeFormatted: string;
}

export interface LocalAgentStatus {
  connected: boolean;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  agentVersion?: string;
  platform?: string;
  hostname?: string;
  uptime?: number;
  port?: number;
  drives?: LocalAgentDriveInfo[];
  activeDestination?: string;
  freeSpace?: string;
  freeSpaceBytes?: number;
  schedulerRunning?: boolean;
  lastBackupTime?: string | null;
  message?: string;
  message_en?: string;
  helperConnected?: boolean;
  helperSessionId?: number;
  helperChannel?: string;
  error?: string;
}

export interface BackupRecord {
  id: string; // e.g., 'BCT-BAK-2026-001'
  filename: string; // e.g., 'bct_backup_20261119_030000.bctbak'
  name: string;
  type: BackupType;
  destination: BackupDestination;
  status: BackupStatus;
  size_bytes: number;
  size_formatted: string;
  created_at: string;
  created_by: string;
  created_by_name: string;
  checksum_sha256: string;
  is_verified: boolean;
  is_safety_snapshot?: boolean;
  google_drive_file_id?: string;
  google_drive_folder_id?: string;
  error_message?: string;
  tables_included: string[];
  total_records: number;
  download_url?: string;
  full_path?: string;
  destination_paths?: Record<string, string>;
}

export interface BackupScheduleConfig {
  enabled: boolean;
  frequency: BackupFrequency;
  execution_time: string; // '03:00' (24-hour format)
  day_of_week: number; // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  day_of_month: number; // 1 to 31
  timezone: string; // Default: 'Africa/Cairo'
  destination: BackupDestination;
  local_backup_path?: string; // Configurable server backup directory path, e.g. './backups'
  windows_backup_path?: string; // Configurable real Windows directory path, e.g. 'C:\BCT Backups'
  destinations?: BackupDestinationsConfig;
  retention_days?: number;
  last_run_at?: string;
  next_run_at?: string;
  last_status?: BackupStatus;
  auto_retry_on_failure: boolean;
  max_retries: number;
}

export interface BackupRetentionPolicy {
  daily_backups_to_keep: number;
  weekly_backups_to_keep: number;
  monthly_backups_to_keep: number;
  max_storage_allocation_mb: number;
  auto_purge_enabled: boolean;
}

export interface GoogleDriveFolderItem {
  id: string;
  name: string;
  created_at?: string;
  is_default?: boolean;
}

export interface DirectoryValidationResult {
  valid: boolean;
  path: string;
  exists: boolean;
  writable: boolean;
  message: string;
  message_en: string;
}

export interface ApprovedDirectoryItem {
  path: string;
  name: string;
  name_en: string;
  isDefault?: boolean;
  isCustom?: boolean;
}

export interface GoogleDriveConfig {
  connected: boolean;
  account_email?: string;
  account_name?: string;
  folder_id?: string;
  folder_name: string;
  folders_list?: GoogleDriveFolderItem[];
  auto_upload: boolean;
  last_synced_at?: string;
  status: 'connected' | 'disconnected' | 'token_expired' | 'connecting' | 'error';
  error_message?: string;
}

export interface BackupOverviewStats {
  total_backups: number;
  last_successful_backup: BackupRecord | null;
  next_scheduled_backup: string | null;
  total_storage_used_bytes: number;
  total_storage_used_formatted: string;
  failed_attempts_count: number;
  local_backups_count: number;
  google_drive_backups_count: number;
}

export interface BCTBakManifest {
  magic: 'BCT_ENTERPRISE_BACKUP';
  format: 'BCTBAK';
  format_version: '2.0.0' | '1.0.0';
  backup_id: string;
  created_at: string;
  created_by: string;
  created_by_name: string;
  backup_type: BackupType;
  destination: BackupDestination;
  environment: string;
  schema_version: string;
  tables_count: number;
  total_records: number;
  records_per_table?: Record<string, number>;
  content_sha256: string;
  archive_sha256?: string;
}

export interface BackupArchiveHeader {
  magic: 'BCT_ENTERPRISE_BACKUP';
  version: '1.0.0' | '2.0.0';
  backup_id: string;
  created_at: string;
  created_by: string;
  created_by_name: string;
  backup_type: BackupType;
  destination: BackupDestination;
  environment: string;
  schema_version: string;
  checksum_sha256: string;
  total_records: number;
  tables_count: number;
}

export interface BackupRestorePayload {
  header: BackupArchiveHeader;
  manifest?: BCTBakManifest;
  tables: Record<string, any>;
  settings?: Record<string, any>;
  security: {
    checksum: string;
    integrityVerified: boolean;
  };
}

export type BackupArchiveFormatType = 
  | 'BCTBAK_V2'
  | 'BCTBAK_V1'
  | 'BCTBAK_ENCRYPTED'
  | 'DIRECT_JSON'
  | 'LEGACY_JSON_SNAPSHOT'
  | 'UNKNOWN';

export interface BackupVerificationResult {
  valid: boolean;
  format?: BackupArchiveFormatType;
  formatNameAr?: string;
  formatNameEn?: string;
  version?: string;
  errors: string[];
  warnings: string[];
  header?: BackupArchiveHeader;
  manifest?: BCTBakManifest;
  recordsSummary?: Record<string, number>;
  totalRecords?: number;
  tablesCount?: number;
  checksumVerified?: boolean;
  isLegacyJson?: boolean;
}

export interface BackupFilter {
  searchQuery?: string;
  type?: 'all' | BackupType;
  destination?: 'all' | BackupDestination;
  status?: 'all' | BackupStatus;
  startDate?: string;
  endDate?: string;
}

