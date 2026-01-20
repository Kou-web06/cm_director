import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../theme';

interface LiveInfo {
  name: string;
  artist: string;
  date: Date;
  venue: string;
  seat?: string;
  startTime: string;
  endTime: string;
  imageUrl?: string;
  qrCode?: string;
  memo?: string;
  detail?: string;
}

interface Props {
  initialData: LiveInfo | null;
  onSave: (info: LiveInfo) => void;
  onCancel: () => void;
}

export default function LiveEditScreen({ initialData, onSave, onCancel }: Props) {
  const parseHour = (timeStr?: string, defaultHour: number = 18): number => {
    if (!timeStr || typeof timeStr !== 'string') {
      return defaultHour;
    }
    try {
      const hour = parseInt(timeStr.split(':')[0], 10);
      return isNaN(hour) ? defaultHour : hour;
    } catch {
      return defaultHour;
    }
  };

  const [name, setName] = useState(initialData?.name || '');
  const [artist, setArtist] = useState(initialData?.artist || '');
  const [date, setDate] = useState(initialData?.date || new Date());
  const [venue, setVenue] = useState(initialData?.venue || '');
  const [seat, setSeat] = useState(initialData?.seat || '');
  const [startTimeHour, setStartTimeHour] = useState(parseHour(initialData?.startTime, 18));
  const [endTimeHour, setEndTimeHour] = useState(parseHour(initialData?.endTime, 20));
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [qrCode, setQrCode] = useState(initialData?.qrCode || '');
  const [memo, setMemo] = useState(initialData?.memo || '');
  const [detail, setDetail] = useState(initialData?.detail || '');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUrl(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (!name || !artist || !venue) {
      Alert.alert('エラー', '全ての項目を入力してください');
      return;
    }

    onSave({
      name,
      artist,
      date,
      venue,
      seat,
      startTime: `${String(startTimeHour).padStart(2, '0')}:00`,
      endTime: `${String(endTimeHour).padStart(2, '0')}:00`,
      imageUrl,
      qrCode,
      memo,
      detail,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ライブ情報の設定</Text>
        <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
          <Ionicons name="checkmark" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ジャケット画像 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ジャケット画像</Text>
          <TouchableOpacity
            style={styles.imagePickerButton}
            onPress={handlePickImage}
          >
            <View style={styles.imagePickerBlur}>
              {imageUrl ? (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.imagePreview}
                    contentFit="cover"
                  />
                  <Text style={styles.imagePreviewText}>タップして変更</Text>
                </View>
              ) : (
                <View style={styles.imagePickerContent}>
                  <Ionicons name="image-outline" size={48} color="#CCCCCC" />
                  <Text style={styles.imagePickerText}>タップして画像を選択</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* ライブ名 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ライブ名</Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputBlur}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="例: TOUR 2026"
                placeholderTextColor="#CCCCCC"
              />
            </View>
          </View>
        </View>

        {/* アーティスト名 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>アーティスト名</Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputBlur}>
              <TextInput
                style={styles.input}
                value={artist}
                onChangeText={setArtist}
                placeholder="例: YOUR FAVORITE ARTIST"
                placeholderTextColor="#CCCCCC"
              />
            </View>
          </View>
        </View>

        {/* 日付 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>日付</Text>
          <TouchableOpacity
            style={styles.inputContainer}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.inputBlur}>
              <View style={styles.dateButton}>
                <Ionicons name="calendar-outline" size={20} color="#666666" />
                <Text style={styles.dateText}>
                  {date.toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short',
                  })}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setDate(selectedDate);
              }
            }}
          />
        )}

        {/* 時間 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>開始時間</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={startTimeHour}
              onValueChange={(value) => setStartTimeHour(value)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <Picker.Item
                  key={i}
                  label={`${String(i).padStart(2, '0')}:00`}
                  value={i}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>終了時間</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={endTimeHour}
              onValueChange={(value) => setEndTimeHour(value)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <Picker.Item
                  key={i}
                  label={`${String(i).padStart(2, '0')}:00`}
                  value={i}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* 会場 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>会場</Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputBlur}>
              <TextInput
                style={styles.input}
                value={venue}
                onChangeText={setVenue}
                placeholder="例: 東京ドーム"
                placeholderTextColor="#CCCCCC"
              />
            </View>
          </View>
        </View>

        {/* 座席 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>座席</Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputBlur}>
              <TextInput
                style={styles.input}
                value={seat}
                onChangeText={setSeat}
                placeholder="例: アリーナA-10"
                placeholderTextColor="#CCCCCC"
              />
            </View>
          </View>
        </View>

        {/* QRコード */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>QRコード（URL等）</Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputBlur}>
              <TextInput
                style={styles.input}
                value={qrCode}
                onChangeText={setQrCode}
                placeholder="例: https://example.com"
                placeholderTextColor="#CCCCCC"
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
          </View>
        </View>

        {/* 思い出（メモ）*/}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>思い出（メモ）</Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputBlur}>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={memo}
                onChangeText={setMemo}
                placeholder="思い出をメモに残す..."
                placeholderTextColor="#CCCCCC"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* SET LIST */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SET LIST</Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputBlur}>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={detail}
                onChangeText={setDetail}
                placeholder="演奏された曲を入力（1曲ずつ改行）"
                placeholderTextColor="#CCCCCC"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    paddingBottom: theme.spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 30,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F8F8F8',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 300,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999999',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputBlur: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  input: {
    fontSize: 16,
    color: '#000',
  },
  multilineInput: {
    minHeight: 100,
  },
  imagePickerButton: {
    borderRadius: 12,
    height: 150,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  imagePickerBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerContent: {
    alignItems: 'center',
    gap: 12,
  },
  imagePickerText: {
    fontSize: 14,
    color: '#999999',
  },
  imagePreviewContainer: {
    alignItems: 'center',
    gap: 8,
    padding: 10,
  },
  imagePreview: {
    width: 80,
    height: 90,
    borderRadius: 8,
  },
  imagePreviewText: {
    fontSize: 12,
    color: '#999999',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#000',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  picker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 200 : 60,
  },
  pickerItem: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
