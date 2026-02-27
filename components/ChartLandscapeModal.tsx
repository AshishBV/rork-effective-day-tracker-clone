import React, { useEffect, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Dimensions,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import { X } from 'lucide-react-native';
import * as ScreenOrientation from 'expo-screen-orientation';

interface ChartLandscapeModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function ChartLandscapeModal({ 
  visible, 
  onClose, 
  children 
}: ChartLandscapeModalProps) {
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const scaleAnim = useMemo(() => new Animated.Value(0.95), []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.95);
    }
  }, [visible]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const lockOrientation = async () => {
      if (visible) {
        try {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } catch (e) {
          console.log('Could not lock orientation:', e);
        }
      } else {
        try {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        } catch (e) {
          console.log('Could not unlock orientation:', e);
        }
      }
    };

    lockOrientation();

    return () => {
      if (Platform.OS !== 'web') {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
      }
    };
  }, [visible]);

  const { width, height } = Dimensions.get('window');
  const landscapeWidth = Math.max(width, height);
  const landscapeHeight = Math.min(width, height);

  return (
    <Modal
      visible={visible}
      animationType="none"
      supportedOrientations={['landscape-left', 'landscape-right', 'portrait']}
      onRequestClose={onClose}
    >
      <StatusBar hidden={visible} />
      <Animated.View 
        style={[
          styles.container, 
          { 
            width: landscapeWidth, 
            height: landscapeHeight,
            opacity: fadeAnim,
          }
        ]}
      >
        <Animated.View 
          style={[
            styles.innerContainer,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.chartContainer}>
            {children}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  chartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
