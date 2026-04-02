import AsyncStorage from '@react-native-async-storage/async-storage';

interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
    data?: any;
}

let logBuffer: LogEntry[] = [];
const LOG_KEY = 'match_debug_logs';

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

        console.log('Attempting to save logs...');
        console.log('Log content length:', logContent.length);

        // Save to AsyncStorage (always available)
        await AsyncStorage.setItem(LOG_KEY, logContent);
        console.log('Logs saved to AsyncStorage');

        return 'Logs saved to device storage (check Debug tab or export via Expo)';
    } catch (error) {
        console.error('Failed to save logs:', error);
        throw error;
    }
};

export const getLogs = async () => {
    try {
        const logs = await AsyncStorage.getItem(LOG_KEY);
        return logs || 'No logs found';
    } catch (error) {
        console.error('Failed to retrieve logs:', error);
        return null;
    }
};

export const clearLogs = async () => {
    logBuffer = [];
    try {
        await AsyncStorage.removeItem(LOG_KEY);
    } catch (error) {
        console.error('Failed to clear logs:', error);
    }
};

export const getLogBuffer = () => logBuffer;
