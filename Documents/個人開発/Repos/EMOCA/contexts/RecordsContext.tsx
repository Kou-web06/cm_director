import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChekiRecord {
  id: string;
  artist: string;
  liveName: string;
  date: string;
  venue?: string;
  seat?: string;
  startTime?: string;
  endTime?: string;
  imageUrl: string;
  memo: string;
  detail?: string;
  qrCode?: string;
}

const INITIAL_RECORDS: ChekiRecord[] = [
  {
    id: '1',
    artist: 'The Beatles',
    liveName: 'Reunion Tour 2024',
    date: '2024.12.15',
    venue: '東京ドーム',
    imageUrl: 'https://picsum.photos/300/400?random=1',
    memo: '最高のコンサートでした！',
    detail: 'Let It Be\nThe Long and Winding Road\nHey Jude\nHere Comes the Sun',
  },
];

interface RecordsContextType {
  records: ChekiRecord[];
  addRecord: (record: ChekiRecord) => void;
  updateRecord: (id: string, record: ChekiRecord) => void;
  deleteRecord: (id: string) => void;
}

const RecordsContext = createContext<RecordsContextType | undefined>(undefined);

export const RecordsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<ChekiRecord[]>(INITIAL_RECORDS);
  const [isLoaded, setIsLoaded] = useState(false);

  // AsyncStorageからデータを読み込む
  useEffect(() => {
    loadRecords();
  }, []);

  // recordsが変更されたら保存
  useEffect(() => {
    if (isLoaded) {
      saveRecords();
    }
  }, [records, isLoaded]);

  const loadRecords = async () => {
    try {
      const storedRecords = await AsyncStorage.getItem('@records');
      if (storedRecords !== null) {
        setRecords(JSON.parse(storedRecords));
      }
    } catch (error) {
      console.error('Failed to load records:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveRecords = async () => {
    try {
      await AsyncStorage.setItem('@records', JSON.stringify(records));
    } catch (error) {
      console.error('Failed to save records:', error);
    }
  };

  const addRecord = (record: ChekiRecord) => {
    setRecords([record, ...records]);
  };

  const updateRecord = (id: string, updatedRecord: ChekiRecord) => {
    setRecords(records.map(r => r.id === id ? updatedRecord : r));
  };

  const deleteRecord = (id: string) => {
    setRecords(records.filter(r => r.id !== id));
  };

  return (
    <RecordsContext.Provider value={{ records, addRecord, updateRecord, deleteRecord }}>
      {children}
    </RecordsContext.Provider>
  );
};

export const useRecords = (): RecordsContextType => {
  const context = useContext(RecordsContext);
  if (context === undefined) {
    throw new Error('useRecords must be used within a RecordsProvider');
  }
  return context;
};
