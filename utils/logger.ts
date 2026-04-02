import * as FileSystem from 'expo-file-system';

const LOG_FILE = FileSystem.documentDirectory + 'match_detail_debug.log';

interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
    data?: any;
}

let logBuffer: LogEntry[] = [];

export const addLog = (level: string, message: string, data?: any) => {
    const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        data,
    };
    logBuffer.push(entry);
    
    // Also log to console
    if (data) {
        console.log(`[${level}] ${message}`, data);
    } else {
        console.log(`[${level}] ${message}`);
    }
};

export const debugLog = (message: string, data?: any) => addLog('DEBUG', message, data);
export const infoLog = (message: string, data?: any) => addLog('INFO', message, data);
export const errorLog = (message: string, data?: any) => addLog('ERROR', message, data);

export const flushLogsToFile = async () => {
    try {
        const logContent = logBuffer
            .map((entry) => {
                const dataStr = entry.data ? `\nData: ${JSON.stringify(entry.data, null, 2)}` : '';
                return `[${entry.timestamp}] [${entry.level}] ${entry.message}${dataStr}`;
            })
            .join('\n\n');

        await FileSystem.writeAsStringAsync(LOG_FILE, logContent, {
            encoding: FileSystem.EncodingType.UTF8,
        });

        console.log('Logs saved to:', LOG_FILE);
        
        // Return the file path so user can access it
        return LOG_FILE;
    } catch (error) {
        console.error('Failed to write logs:', error);
    }
};

export const clearLogs = () => {
    logBuffer = [];
};

export const getLogFilePath = () => LOG_FILE;
