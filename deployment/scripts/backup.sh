#!/bin/bash

# Database Backup Script for Contractor Platform
# Runs daily automated backups with retention policy

set -e

# Configuration
DB_CONTAINER="contractor-postgres-prod"
DB_USER="contractor_prod_user"
DB_NAME="contractor_platform" 
BACKUP_DIR="/backups"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
S3_BUCKET="${S3_BACKUP_BUCKET:-contractor-platform-backups}"

# Create timestamp for backup file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="contractor_platform_backup_${TIMESTAMP}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

echo "📦 Starting backup process..."
echo "Backup file: $BACKUP_FILE"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create database dump
echo "Creating database backup..."
pg_dump -h postgres -U "$DB_USER" "$DB_NAME" > "$BACKUP_PATH"

if [ $? -eq 0 ]; then
    echo "✅ Database backup created successfully"
    
    # Compress backup
    gzip "$BACKUP_PATH"
    BACKUP_PATH="${BACKUP_PATH}.gz"
    BACKUP_FILE="${BACKUP_FILE}.gz"
    
    echo "🗜️  Backup compressed"
    
    # Upload to S3 (if configured)
    if [ ! -z "$S3_BUCKET" ] && command -v aws >/dev/null 2>&1; then
        echo "☁️  Uploading backup to S3..."
        aws s3 cp "$BACKUP_PATH" "s3://$S3_BUCKET/daily/$BACKUP_FILE"
        
        if [ $? -eq 0 ]; then
            echo "✅ Backup uploaded to S3"
        else
            echo "⚠️  S3 upload failed, backup saved locally only"
        fi
    else
        echo "ℹ️  S3 not configured, backup saved locally only"
    fi
    
    # Clean up old local backups
    echo "🧹 Cleaning up old backups (keeping last $RETENTION_DAYS days)..."
    find "$BACKUP_DIR" -name "contractor_platform_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    # Clean up old S3 backups
    if [ ! -z "$S3_BUCKET" ] && command -v aws >/dev/null 2>&1; then
        CUTOFF_DATE=$(date -d "$RETENTION_DAYS days ago" +%Y%m%d)
        aws s3 ls "s3://$S3_BUCKET/daily/" | while read -r line; do
            BACKUP_DATE=$(echo "$line" | grep -o '[0-9]\{8\}' | head -1)
            if [ "$BACKUP_DATE" -lt "$CUTOFF_DATE" ]; then
                FILENAME=$(echo "$line" | awk '{print $4}')
                aws s3 rm "s3://$S3_BUCKET/daily/$FILENAME"
                echo "🗑️  Removed old S3 backup: $FILENAME"
            fi
        done
    fi
    
    echo "📊 Backup statistics:"
    echo "   - Local backups: $(find "$BACKUP_DIR" -name "*.sql.gz" | wc -l) files"
    echo "   - Backup size: $(du -h "$BACKUP_PATH" | cut -f1)"
    echo "   - Total backup space: $(du -sh "$BACKUP_DIR" | cut -f1)"
    
    echo "✅ Backup process completed successfully"
    
else
    echo "❌ Database backup failed"
    exit 1
fi

# Optional: Send notification about backup status
if [ ! -z "$WEBHOOK_URL" ]; then
    curl -X POST "$WEBHOOK_URL" \
         -H "Content-Type: application/json" \
         -d "{\"text\":\"📦 Contractor Platform backup completed: $BACKUP_FILE\"}"
fi