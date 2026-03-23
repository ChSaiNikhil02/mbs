# PostgreSQL Backup Script for Modern Digital Banking
$DbName = "banking_db"
$DbUser = "postgres"
$DbPass = "Nikhil@02"
$BackupDir = "C:\PostgresBackups"
$LogFile = "$BackupDir\backup_log.txt"
$PgDumpPath = "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe"
$Date = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "$BackupDir\backup_$DbName`_$Date.sql"

function Log-Message($Message) {
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$Timestamp : $Message" | Out-File -FilePath $LogFile -Append
}

Log-Message "Starting backup of $DbName to $BackupFile..."

# Set Password for pg_dump
$env:PGPASSWORD = $DbPass

# Execute backup
try {
    & $PgDumpPath -U $DbUser -h localhost -p 5432 -d $DbName -f $BackupFile 2>&1 | Out-File -FilePath $LogFile -Append
    if ($LASTEXITCODE -eq 0) {
        Log-Message "Backup completed successfully."
    } else {
        Log-Message "Backup failed with exit code $LASTEXITCODE"
        exit $LASTEXITCODE
    }
} catch {
    Log-Message "Error: $_"
    exit 1
}

# Cleanup: Remove backups older than 7 days
Log-Message "Cleaning up old backups..."
Get-ChildItem -Path $BackupDir -Filter "backup_$DbName*.sql" | Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-7) } | ForEach-Object {
    Log-Message "Removing old backup: $($_.Name)"
    Remove-Item $_.FullName
}
Log-Message "Cleanup complete."
