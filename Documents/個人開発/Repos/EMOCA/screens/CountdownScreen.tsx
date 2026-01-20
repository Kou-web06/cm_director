import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ImageBackground, Modal, Dimensions, Animated, Pressable, Linking, Share, Alert, TextInput, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome6 } from '@expo/vector-icons';
import { theme } from '../theme';
import LiveEditScreen from './LiveEditScreen';
import SettingsScreen from './SettingsScreen';
import { useRecords, ChekiRecord } from '../contexts/RecordsContext';

interface LiveInfo {
  name: string;
  artist: string;
  date: Date;
  venue: string;
  startTime: string;
  endTime: string;
  imageUrl?: string;
  qrCode?: string;
  memo?: string;
  detail?: string;
}

const Stack = createNativeStackNavigator();

function CountdownMain({ navigation }: any) {
  const { records, addRecord, updateRecord } = useRecords();
  const [showEditScreen, setShowEditScreen] = useState(false);
  const [isJacketMoved, setIsJacketMoved] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklistItems, setChecklistItems] = useState([
    { id: '1', text: '身分証明証', checked: false },
    { id: '2', text: '財布・現金', checked: false },
    { id: '3', text: 'ペンライト', checked: false },
    { id: '4', text: '充電器', checked: false },
    { id: '5', text: 'タオル', checked: false },
  ]);
  const jacketAnimX = useRef(new Animated.Value(0)).current;
  const jacketAnimRotate = useRef(new Animated.Value(0)).current;
  
  // 日付で新しい順にソート（最新のライブが先頭）
  const toTime = (record: ChekiRecord) => {
    if (!record?.date) return 0;
    const time = new Date(record.date.replace(/\./g, '-')).getTime();
    return Number.isNaN(time) ? 0 : time;
  };
  const sortedRecords = [...records].sort((a, b) => toTime(b) - toTime(a));

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}.${month}.${day}`;
  };
  
  // カウントダウンするライブを決定
  let nextRecord: ChekiRecord | null = null;
  const now = new Date().getTime();
  
  // ソート済みレコードから最初の未来のライブを探す
  for (const record of sortedRecords) {
    const liveDate = new Date(record.date?.replace(/\./g, '-') || '').getTime();
    if (liveDate > now) {
      nextRecord = record;
      break;
    }
  }
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [liveStatus, setLiveStatus] = useState<'before' | 'during' | 'after'>('before');
  const [showEmptyAfterEnd, setShowEmptyAfterEnd] = useState(false);
  const [isCreatingNewLive, setIsCreatingNewLive] = useState(false);

  useEffect(() => {
    if (!nextRecord || !nextRecord.date || typeof nextRecord.date !== 'string') return;
    // 新しいレコード評価時に終了後の空画面フラグをリセット
    setShowEmptyAfterEnd(false);
    
    const liveDate = new Date(nextRecord.date.replace(/\./g, '-'));
    const startTime = nextRecord.startTime || '00:00';
    const endTime = nextRecord.endTime || '23:59';
    
    // 開始時刻と終了時刻を設定
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const liveStartDateTime = new Date(liveDate);
    liveStartDateTime.setHours(startHour, startMin, 0, 0);
    
    const liveEndDateTime = new Date(liveDate);
    liveEndDateTime.setHours(endHour, endMin, 0, 0);
    
    const timer = setInterval(() => {
      const now = new Date();
      
      // 終了時刻を過ぎた場合
      if (now.getTime() >= liveEndDateTime.getTime()) {
        setLiveStatus('after');
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        // 3秒間「Enjoy」を表示した後、設定未画面へ
        const timeout = setTimeout(() => {
          setShowEmptyAfterEnd(true);
        }, 3000);
        clearInterval(timer);
        return () => clearTimeout(timeout);
      }
      
      // 開始時刻を過ぎた場合
      if (now.getTime() >= liveStartDateTime.getTime()) {
        setLiveStatus('during');
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      // 開始前：カウントダウン表示
      setLiveStatus('before');
      const diff = liveStartDateTime.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({ days, hours, minutes, seconds });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [nextRecord]);

  const handleJacketTap = () => {
    const toX = isJacketMoved ? 0 : -130;
    const toRotate = isJacketMoved ? 0 : -3;
    
    Animated.parallel([
      Animated.spring(jacketAnimX, {
        toValue: toX,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.spring(jacketAnimRotate, {
        toValue: toRotate,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
    ]).start();
    
    setIsJacketMoved(!isJacketMoved);
  };

  const handleMapPress = () => {
    if (!nextRecord?.venue) {
      Alert.alert('会場情報がありません', 'ライブ情報を設定してください');
      return;
    }
    const url = `https://maps.google.com/?q=${encodeURIComponent(nextRecord.venue)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('エラー', 'マップアプリを開けませんでした');
    });
  };

  const handleChecklistPress = () => {
    setShowChecklist(true);
  };

  const handleSharePress = async () => {
    if (!nextRecord) return;
    try {
      await Share.share({
        message: `🎵 ${nextRecord.artist} - ${nextRecord.liveName}\n📅 ${nextRecord.date}\n📍 ${nextRecord.venue}\n\n参戦予定！ #EMOCA`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const toggleChecklistItem = (id: string) => {
    setChecklistItems(items =>
      items.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const addChecklistItem = (text: string) => {
    if (text.trim()) {
      setChecklistItems(items => [
        ...items,
        { id: Date.now().toString(), text: text.trim(), checked: false },
      ]);
    }
  };

  const deleteChecklistItem = (id: string) => {
    setChecklistItems(items => items.filter(item => item.id !== id));
  };

  const handleSaveLiveInfo = (info: LiveInfo) => {
    if (!nextRecord || isCreatingNewLive) {
      // 新規作成の場合
      const newRecord: ChekiRecord = {
        id: Date.now().toString(),
        artist: info.artist,
        liveName: info.name,
        date: formatDate(info.date),
        venue: info.venue,
        seat: info.seat || '',
        startTime: info.startTime,
        endTime: info.endTime,
        imageUrl: info.imageUrl || '',
        memo: info.memo || '',
        detail: info.detail || '',
        qrCode: info.qrCode || '',
      };
      addRecord(newRecord);
    } else {
      // 既存レコードの更新
      const updatedRecord: ChekiRecord = {
        ...nextRecord,
        artist: info.artist,
        liveName: info.name,
        date: formatDate(info.date),
        venue: info.venue,
        seat: info.seat || nextRecord.seat,
        startTime: info.startTime,
        endTime: info.endTime,
        imageUrl: info.imageUrl || nextRecord.imageUrl,
        memo: info.memo || nextRecord.memo,
        detail: info.detail || nextRecord.detail,
        qrCode: info.qrCode || nextRecord.qrCode,
      };
      updateRecord(nextRecord.id, updatedRecord);
    }
    setShowEditScreen(false);
    setIsCreatingNewLive(false);
  };

  const renderEmptyState = () => (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View
        style={[styles.gradient, { backgroundColor: '#000' }]}
      >
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <BlurView intensity={20} tint="dark" style={styles.settingsButtonBlur}>
            <Ionicons name="settings-outline" size={24} color="#FFF" />
          </BlurView>
        </TouchableOpacity>
        <View style={styles.emptyContainer}>
          <Image
            source={require('../assets/finding.png')}
            style={{ width: 150, height: 150, marginVertical: 20 }}
            contentFit="contain"
          />
          <Text style={styles.emptyTitle}>次のライブを設定しよう</Text>
          <Text style={styles.emptySubtitle}>
            ライブまでの時間をカウントダウンできます
          </Text>
          <TouchableOpacity
            style={styles.setupButton}
            onPress={() => { setIsCreatingNewLive(true); setShowEditScreen(true); }}
          >
            <LinearGradient
              colors={['#2d2d2d', '#2d2d2d']}
              style={styles.setupButtonGradient}
            >
              <Ionicons name="add-circle" size={24} color="#FFF" />
              <Text style={styles.setupButtonText}>ライブを設定</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderCountdown = () => {
    if (!nextRecord) return null;
    const record = nextRecord;
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    const cardWidth = Math.min(280, screenWidth - 40);
    const cardHeight = Math.min(760, cardWidth * 2.85);
    const qrSize = Math.min(155, cardWidth * 0.45);

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        {/* Dynamic Blur Background */}
        {record.imageUrl ? (
          <>
            <ImageBackground
              source={{ uri: record.imageUrl }}
              style={styles.backgroundImage}
              resizeMode="cover"
              blurRadius={50}
            />
            <BlurView intensity={50} tint="dark" style={styles.blurOverlay} />
          </>
        ) : (
          <View style={[styles.gradient, { backgroundColor: '#000' }]} />
        )}

        {/* ヘッダー */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>NEXT LIVE</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => { setIsCreatingNewLive(false); setShowEditScreen(true); }}
            >
              <BlurView intensity={20} tint="dark" style={styles.buttonBlur}>
                <FontAwesome6 name="sliders" size={20} color="#FFF" />
              </BlurView>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <BlurView intensity={20} tint="dark" style={styles.buttonBlur}>
                <MaterialIcons name="settings" size={20} color="#FFF" />
              </BlurView>
            </TouchableOpacity>
          </View>
        </View>

        {/* カウントダウン */}
        <View style={styles.countdownDisplayContainer}>
          {liveStatus === 'during' || liveStatus === 'after' ? (
            <Text style={styles.enjoyText}>Enjoy Your Live !!</Text>
          ) : (
            <View style={styles.countdownRow}>
              <View style={styles.countdownNumber}>
                <Text style={styles.countdownValue}>{countdown.days}</Text>
                <Text style={styles.countdownLabel}>D</Text>
              </View>
              <Text style={styles.countdownSeparator}>:</Text>
              <View style={styles.countdownNumber}>
                <Text style={styles.countdownValue}>{countdown.hours.toString().padStart(2, '0')}</Text>
                <Text style={styles.countdownLabel}>H</Text>
              </View>
              <Text style={styles.countdownSeparator}>:</Text>
              <View style={styles.countdownNumber}>
                <Text style={styles.countdownValue}>{countdown.minutes.toString().padStart(2, '0')}</Text>
                <Text style={styles.countdownLabel}>M</Text>
              </View>
              <Text style={styles.countdownSeparator}>:</Text>
              <View style={styles.countdownNumber}>
                <Text style={styles.countdownValue}>{countdown.seconds.toString().padStart(2, '0')}</Text>
                <Text style={styles.countdownLabel}>S</Text>
              </View>
            </View>
          )}
        </View>

        {/* 機能ボタン */}
        <View style={styles.featureButtonsContainer}>
          <TouchableOpacity style={[styles.featureButton, {position:'absolute', top: -15, left: 20, transform: [{ rotate: '-3deg' }]}]} onPress={handleMapPress}>
            <Image
              source={require('../assets/button-icon/map.png')}
              style={styles.featureButtonIcon}
              contentFit="contain"
            />
            <Text style={styles.featureButtonLabel}>#会場マップ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.featureButton, {position:'absolute', top: 10, left: 140, transform: [{ rotate: '3deg' }]}]} onPress={handleChecklistPress}>
            <Image
              source={require('../assets/button-icon/prepare.png')}
              style={styles.featureButtonIcon}
              contentFit="contain"
            />
            <Text style={styles.featureButtonLabel}>#持ち物リスト</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.featureButton, {position:'absolute', top: -15, left: 250, transform: [{ rotate: '-3deg' }]}]} onPress={handleSharePress}>
            <Image
              source={require('../assets/button-icon/share.png')}
              style={styles.featureButtonIcon}
              contentFit="contain"
            />
            <Text style={styles.featureButtonLabel}>#参戦シェア</Text>
          </TouchableOpacity>
        </View>

        {/* チケットカード */}
        <View style={[styles.ticketHost, { height: cardHeight + 40 }]}>
          <View style={[styles.ticketCard, { width: cardWidth, height: cardHeight }]}>
            <Svg width="100%" height="100%" viewBox="0 0 280 529" fill="none">
              <Path d="M279.118 201.1C275.555 201.681 272.834 204.772 272.834 208.5C272.834 212.228 275.555 215.319 279.118 215.9L279.118 531.006C278.95 531.004 278.782 531 278.613 531C259.927 531 244.767 544.319 244.64 560.791L33.9746 560.791C33.8473 544.319 18.6859 531 0 531L0 215.991C0.110743 215.996 0.222045 216 0.333984 216C4.47612 216 7.83398 212.642 7.83398 208.5C7.83398 204.358 4.47612 201 0.333984 201C0.222045 201 0.110743 201.004 0 201.009L0 30C18.4716 29.9996 33.5006 16.9848 33.9658 0.774414L33.9766 0L244.637 0C244.637 16.5684 259.848 29.9998 278.613 30C278.782 30 278.95 29.9963 279.118 29.9941L279.118 201.1ZM27.834 208.5C27.834 204.358 24.4761 201 20.334 201C16.1921 201 12.834 204.358 12.834 208.5C12.834 212.642 16.1921 216 20.334 216C24.4761 216 27.834 212.642 27.834 208.5ZM47.834 208.5C47.834 204.358 44.4761 201 40.334 201C36.1921 201 32.834 204.358 32.834 208.5C32.834 212.642 36.1921 216 40.334 216C44.4761 216 47.834 212.642 47.834 208.5ZM67.834 208.5C67.834 204.358 64.4761 201 60.334 201C56.1921 201 52.834 204.358 52.834 208.5C52.834 212.642 56.1921 216 60.334 216C64.4761 216 67.834 212.642 67.834 208.5ZM87.834 208.5C87.834 204.358 84.4761 201 80.334 201C76.1921 201 72.834 204.358 72.834 208.5C72.834 212.642 76.1921 216 80.334 216C84.4761 216 87.834 212.642 87.834 208.5ZM107.834 208.5C107.834 204.358 104.476 201 100.334 201C96.1921 201 92.834 204.358 92.834 208.5C92.834 212.642 96.1921 216 100.334 216C104.476 216 107.834 212.642 107.834 208.5ZM127.834 208.5C127.834 204.358 124.476 201 120.334 201C116.192 201 112.834 204.358 112.834 208.5C112.834 212.642 116.192 216 120.334 216C124.476 216 127.834 212.642 127.834 208.5ZM147.834 208.5C147.834 204.358 144.476 201 140.334 201C136.192 201 132.834 204.358 132.834 208.5C132.834 212.642 136.192 216 140.334 216C144.476 216 147.834 212.642 147.834 208.5ZM167.834 208.5C167.834 204.358 164.476 201 160.334 201C156.192 201 152.834 204.358 152.834 208.5C152.834 212.642 156.192 216 160.334 216C164.476 216 167.834 212.642 167.834 208.5ZM187.834 208.5C187.834 204.358 184.476 201 180.334 201C176.192 201 172.834 204.358 172.834 208.5C172.834 212.642 176.192 216 180.334 216C184.476 216 187.834 212.642 187.834 208.5ZM207.834 208.5C207.834 204.358 204.476 201 200.334 201C196.192 201 192.834 204.358 192.834 208.5C192.834 212.642 196.192 216 200.334 216C204.476 216 207.834 212.642 207.834 208.5ZM227.834 208.5C227.834 204.358 224.476 201 220.334 201C216.192 201 212.834 204.358 212.834 208.5C212.834 212.642 216.192 216 220.334 216C224.476 216 227.834 212.642 227.834 208.5ZM247.834 208.5C247.834 204.358 244.476 201 240.334 201C236.192 201 232.834 204.358 232.834 208.5C232.834 212.642 236.192 216 240.334 216C244.476 216 247.834 212.642 247.834 208.5ZM267.834 208.5C267.834 204.358 264.476 201 260.334 201C256.192 201 252.834 204.358 252.834 208.5C252.834 212.642 256.192 216 260.334 216C264.476 216 267.834 212.642 267.834 208.5Z" fill="white" />
            </Svg>
            <View style={styles.ticketContent} pointerEvents="box-none">
              <View style={styles.qrBlock}>
                {record.qrCode ? (
                  <QRCode value={record.qrCode} size={qrSize} backgroundColor="transparent" />
                ) : (
                  <Image
                    source={require('../assets/no-qr.png')}
                    style={{ width: qrSize, height: qrSize, resizeMode: 'contain' }}
                  />
                )}
                <Text style={styles.qrText}>M3M0R135-N3V3R-D13</Text>
              </View>

              {record.imageUrl ? (
                <Pressable onPress={handleJacketTap}>
                  <Animated.View 
                    style={[
                      styles.jacketShadow,
                      {
                        transform: [
                          { translateX: jacketAnimX },
                          { 
                            rotate: jacketAnimRotate.interpolate({
                              inputRange: [-8, 0],
                              outputRange: ['-8deg', '0deg'],
                            })
                          },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.jacketContainer}>
                      <Image source={{ uri: record.imageUrl }} style={styles.jacketImage} contentFit="cover" />
                    </View>
                  </Animated.View>
                </Pressable>
              ) : null}

              <View style={styles.infoBlock}>
                <Text style={[styles.ticketTitle, (record.liveName || '').length >= 12 && { fontSize: 12 }]}>
                  {record.liveName || '-'}
                </Text>
                <Text style={styles.ticketArtist}>{record.artist || '-'}</Text>
                <View style={[styles.info, { flexDirection: 'column', gap: 6, marginTop: 40 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.infoLabel, { width: 100, textAlign: 'right' }]}>DATE</Text>
                    <Text style={[styles.infoValue, { flex: 1, textAlign: 'left' }]}>{record.date || '-'}   {record.startTime || '-'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.infoLabel, { width: 100, textAlign: 'right' }]}>SEAT</Text>
                    <Text style={[styles.infoValue, { flex: 1, textAlign: 'left' }]}>{record.seat || '-'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.infoLabel, { width: 100, textAlign: 'right' }]}>VENUE</Text>
                    <Text style={[styles.infoValue, { flex: 1, textAlign: 'left'}, (record.venue || '').length > 8 && {fontSize: 16}]}>
                      {record.venue || '-'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <>
      {!nextRecord ? renderEmptyState() : (liveStatus === 'after' && showEmptyAfterEnd) ? renderEmptyState() : renderCountdown()}

      <Modal
        visible={showEditScreen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditScreen(false)}
      >
        <LiveEditScreen
          initialData={!isCreatingNewLive && nextRecord ? {
            name: nextRecord.liveName,
            artist: nextRecord.artist,
            date: new Date(nextRecord.date.replace(/\./g, '-')),
            venue: nextRecord.venue || '',
            seat: nextRecord.seat || '',
            startTime: nextRecord.startTime || '18:00',
            endTime: nextRecord.endTime || '20:00',
            imageUrl: nextRecord.imageUrl,
            qrCode: nextRecord.qrCode,
            memo: nextRecord.memo,
            detail: nextRecord.detail,
          } : null}
          onSave={handleSaveLiveInfo}
          onCancel={() => { setShowEditScreen(false); setIsCreatingNewLive(false); }}
        />
      </Modal>

      <Modal
        visible={showChecklist}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowChecklist(false)}
      >
        <View style={styles.checklistContainer}>
          <View style={styles.checklistHeader}>
            <TouchableOpacity onPress={() => setShowChecklist(false)} style={styles.checklistHeaderButton}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
            <Text style={styles.checklistHeaderTitle}>持ち物リスト</Text>
            <View style={styles.checklistHeaderButton} />
          </View>

          <ScrollView style={styles.checklistScroll} contentContainerStyle={styles.checklistScrollContent}>
            {checklistItems.map((item) => (
              <View key={item.id} style={styles.checklistItem}>
                <TouchableOpacity
                  style={styles.checklistCheckbox}
                  onPress={() => toggleChecklistItem(item.id)}
                >
                  <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                    {item.checked && <Ionicons name="checkmark" size={20} color="#FFF" />}
                  </View>
                  <Text style={[styles.checklistItemText, item.checked && styles.checklistItemTextChecked]}>
                    {item.text}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteChecklistItem(item.id)}>
                  <Ionicons name="trash-outline" size={20} color="#999" />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.checklistAddContainer}>
              <TextInput
                style={styles.checklistInput}
                placeholder="アイテムを追加..."
                placeholderTextColor="#999"
                onSubmitEditing={(e) => {
                  addChecklistItem(e.nativeEvent.text);
                  e.target.clear();
                }}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

export default function CountdownScreen() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background.primary,
        },
      }}
    >
      <Stack.Screen name="CountdownMain" component={CountdownMain} />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          animation: 'slide_from_right',
          presentation: 'card',
          cardStyle: {
            backgroundColor: '#F8F8F8',
          },
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  backgroundImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  blurOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  vignetteOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerContainer: {
    position: 'absolute',
    top: 65,
    left: '10%',
    right: '5%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 35,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
    paddingTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    borderRadius: 30,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    paddingHorizontal: 5,
    paddingVertical: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerButton: {
    overflow: 'hidden',
  },
  buttonBlur: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 35,
  },
  countdownDisplayContainer: {
    width: '100%',
    position: 'absolute',
    top: '17%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  countdownNumber: {
    alignItems: 'center',
  },
  countdownValue: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFF',
    fontVariant: ['tabular-nums'],
    lineHeight: 52,
  },
  countdownLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 1,
    fontWeight: '800',
  },
  countdownSeparator: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFF',
    marginHorizontal: 8,
    lineHeight: 60,
  },
  enjoyText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  ticketHost: {
    position: 'absolute',
    top: 240,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 0,
  },
  ticketCard: {
    position: 'relative',
    backgroundColor: 'transparent',
  },
  ticketContent: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    bottom: 16,
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  qrBlock: {
    position: 'absolute',
    top: 40,
    left: 280 / 2 -  (120 / 2),
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 12,
  },
  qrText: {
    marginTop: 8,
    fontSize: 8,
    fontWeight: '600',
    color: '#000',
    letterSpacing: 1,
  },
  jacketShadow: {
    position: 'absolute',
    top: 40,
    left: -72,   
    width: 130,
    height: 130,
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  jacketContainer: {
    width: 130,
    height: 130,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  jacketImage: {
    width: '100%',
    height: '100%',
  },
  infoBlock: {
    position: 'absolute',
    top: 250,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  ticketTitle: {
    position: 'absolute',
    top: 0,
    left: 35,
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
    textAlign: 'center',
    marginBottom: 5,
  },
  ticketArtist: {
    position: 'absolute',
    top: 30,
    left: 35,
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    textAlign: 'center',
  },
  info: {
    position: 'absolute',
    top: 16,
    left: -20,
    right: 0,
  },
  infoLabel: {
    width: 70,
    fontSize: 16,
    fontWeight: '700',
    color: '#888',
    textAlign: 'left',
    marginRight: 12,
  },
  infoValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    textAlign: 'right',
  },
  ticketContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  ticketPlaceholder: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  settingsButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  settingsButtonBlur: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 24,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 40,
  },
  setupButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  setupButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    gap: 12,
    borderRadius: 35,
  },
  setupButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  featureButtonsContainer: {
    position: 'absolute',
    top: '28%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 20,
    zIndex: 100,
  },
  featureButton: {
    position: 'relative',
    width: 110,
    height: 140,
    alignItems: 'center',
  },
  featureButtonIcon: {
    width: 110,
    height: 110,
  },
  featureButtonLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
  },
  checklistContainer: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F8F8F8',
  },
  checklistHeaderButton: {
    padding: 8,
    width: 44,
  },
  checklistHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  checklistScroll: {
    flex: 1,
  },
  checklistScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checklistCheckbox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#DDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checklistItemText: {
    fontSize: 16,
    color: '#000',
  },
  checklistItemTextChecked: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  checklistAddContainer: {
    marginTop: 8,
  },
  checklistInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
