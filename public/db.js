const DB_NAME = 'PeriodTrackerDB';
const DB_VERSION = 1;
const PERIOD_STORE_NAME = 'periods';
const SETTINGS_STORE_NAME = 'settings';

let db;

function openDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Database error:', event.target.errorCode);
            reject('Database error');
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore(PERIOD_STORE_NAME, { keyPath: 'date' });
            db.createObjectStore(SETTINGS_STORE_NAME, { keyPath: 'key' });
        };
    });
}

async function setPasscode(passcode) {
    const db = await openDB();
    const transaction = db.transaction(SETTINGS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(SETTINGS_STORE_NAME);
    store.put({ key: 'passcode', value: passcode });
    return transaction.complete;
}

async function getPasscode() {
    const db = await openDB();
    const transaction = db.transaction(SETTINGS_STORE_NAME, 'readonly');
    const store = transaction.objectStore(SETTINGS_STORE_NAME);
    const request = store.get('passcode');
    return new Promise((resolve) => {
        request.onsuccess = () => {
            resolve(request.result ? request.result.value : null);
        };
    });
}

async function logPeriodDay(date) {
    const db = await openDB();
    const transaction = db.transaction(PERIOD_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(PERIOD_STORE_NAME);
    store.put({ date });
    return transaction.complete;
}

async function getPeriodDays() {
    const db = await openDB();
    const transaction = db.transaction(PERIOD_STORE_NAME, 'readonly');
    const store = transaction.objectStore(PERIOD_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve) => {
        request.onsuccess = () => {
            resolve(request.result.map(item => item.date));
        };
    });
}

async function removePeriodDay(date) {
    const db = await openDB();
    const transaction = db.transaction(PERIOD_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(PERIOD_STORE_NAME);
    store.delete(date);
    return transaction.complete;
}
