import { useState, useEffect } from 'react';
import { getTokens } from '../src/utils/tokenStorage';
import {
    Text,
    View,
    Alert,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Location from 'expo-location';

// 개발 환경에서 백엔드 API URL 설정
const getApiBaseUrl = () => {
    if (!__DEV__) {
        return 'https://your-api.com';
    }
    
    if (Platform.OS === 'web') {
        return 'http://localhost:3000';
    }
    
    const debuggerHost = Constants.expoConfig?.hostUri?.split(':').shift();
    return `http://${debuggerHost}:3000`;
};

const API_BASE_URL = getApiBaseUrl();

interface PredictionResult {
    prediction: {
        probability: number;
        riskLevel: 'low' | 'medium' | 'high';
        reasons: string[];
        solutions: string[];
    };
    weatherData: {
        temperature: number;
        humidity: number;
        pressure: number;
        condition: string;
    };
}

export default function MigraineScreen() {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [csrfToken, setCsrfToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [predicting, setPredicting] = useState(false);
    const [prediction, setPrediction] = useState<PredictionResult | null>(null);
    
    // 입력 데이터
    const [sleepHours, setSleepHours] = useState('');
    const [stressLevel, setStressLevel] = useState('');
    const [waterIntake, setWaterIntake] = useState('');
    const [exercised, setExercised] = useState<boolean | null>(null);
    const [caffeineIntake, setCaffeineIntake] = useState('');
    const [menstrualCycle, setMenstrualCycle] = useState('');
    
    // 기록 저장용
    const [hadMigraine, setHadMigraine] = useState(false);
    const [painLevel, setPainLevel] = useState('');

    useEffect(() => {
        // tokenStorage에서 토큰 가져오기 (페이지 닫으면 삭제되므로 더 안전)
        const { accessToken: token, csrfToken: csrf } = getTokens();
        if (token) {
            setAccessToken(token);
        }
        if (csrf) {
            setCsrfToken(csrf);
        }
        // 모바일은 메모리에만 저장 (앱 종료 시 삭제)
    }, []);

    const getLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission', 'Location permission is required for weather data');
                return null;
            }

            const location = await Location.getCurrentPositionAsync({});
            return {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };
        } catch (error) {
            console.error('Location error:', error);
            return null;
        }
    };

    const handlePredict = async () => {
        if (!accessToken) {
            Alert.alert('Error', 'Please login first');
            return;
        }

        setPredicting(true);
        try {
            // 위치 정보 가져오기
            const location = await getLocation();

            const body: any = {};
            if (sleepHours) body.sleepHours = parseFloat(sleepHours);
            if (stressLevel) body.stressLevel = parseFloat(stressLevel);
            if (waterIntake) body.waterIntake = parseFloat(waterIntake);
            if (exercised !== null) body.exercised = exercised;
            if (caffeineIntake) body.caffeineIntake = parseFloat(caffeineIntake);
            if (menstrualCycle) body.menstrualCycle = menstrualCycle;

            if (location) {
                body.latitude = location.latitude;
                body.longitude = location.longitude;
            } else {
                // 위치를 못 가져오면 도시 이름 사용 (예: Seoul)
                body.city = 'Seoul';
            }

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            };
            if (csrfToken) {
                headers['x-csrf-token'] = csrfToken;
            }

            const response = await fetch(`${API_BASE_URL}/api/migraine/predict`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Prediction failed');
            }

            const data = await response.json();
            setPrediction(data);
        } catch (error: any) {
            console.error('Prediction error:', error);
            Alert.alert('Error', error.message || 'Failed to predict migraine');
        } finally {
            setPredicting(false);
        }
    };

    const handleSaveRecord = async () => {
        if (!accessToken) {
            Alert.alert('Error', 'Please login first');
            return;
        }

        setLoading(true);
        try {
            const location = await getLocation();

            const body: any = {
                hadMigraine,
            };
            if (sleepHours) body.sleepHours = parseFloat(sleepHours);
            if (stressLevel) body.stressLevel = parseFloat(stressLevel);
            if (waterIntake) body.waterIntake = parseFloat(waterIntake);
            if (exercised !== null) body.exercised = exercised;
            if (caffeineIntake) body.caffeineIntake = parseFloat(caffeineIntake);
            if (menstrualCycle) body.menstrualCycle = menstrualCycle;
            if (hadMigraine && painLevel) {
                body.painLevel = parseFloat(painLevel);
            }

            if (location) {
                body.latitude = location.latitude;
                body.longitude = location.longitude;
            } else {
                body.city = 'Seoul';
            }

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            };
            if (csrfToken) {
                headers['x-csrf-token'] = csrfToken;
            }

            const response = await fetch(`${API_BASE_URL}/api/migraine/records`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save record');
            }

            Alert.alert('Success', 'Record saved successfully');
            // 폼 초기화
            setSleepHours('');
            setStressLevel('');
            setWaterIntake('');
            setExercised(null);
            setCaffeineIntake('');
            setMenstrualCycle('');
            setHadMigraine(false);
            setPainLevel('');
            setPrediction(null);
        } catch (error: any) {
            console.error('Save error:', error);
            Alert.alert('Error', error.message || 'Failed to save record');
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (riskLevel: string) => {
        switch (riskLevel) {
            case 'low':
                return '#4CAF50';
            case 'medium':
                return '#FF9800';
            case 'high':
                return '#F44336';
            default:
                return '#757575';
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>마이그레인 예측 AI</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>신체 데이터 입력</Text>

                <Text style={styles.label}>수면 시간 (시간)</Text>
                <TextInput
                    style={styles.input}
                    value={sleepHours}
                    onChangeText={setSleepHours}
                    placeholder="예: 7.5"
                    keyboardType="numeric"
                />

                <Text style={styles.label}>스트레스 레벨 (0-10)</Text>
                <TextInput
                    style={styles.input}
                    value={stressLevel}
                    onChangeText={setStressLevel}
                    placeholder="예: 5"
                    keyboardType="numeric"
                />

                <Text style={styles.label}>수분 섭취량 (ml)</Text>
                <TextInput
                    style={styles.input}
                    value={waterIntake}
                    onChangeText={setWaterIntake}
                    placeholder="예: 2000"
                    keyboardType="numeric"
                />

                <Text style={styles.label}>운동 여부</Text>
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[
                            styles.button,
                            exercised === true && styles.buttonActive,
                        ]}
                        onPress={() => setExercised(true)}
                    >
                        <Text style={styles.buttonText}>예</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.button,
                            exercised === false && styles.buttonActive,
                        ]}
                        onPress={() => setExercised(false)}
                    >
                        <Text style={styles.buttonText}>아니오</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>카페인 섭취량 (mg)</Text>
                <TextInput
                    style={styles.input}
                    value={caffeineIntake}
                    onChangeText={setCaffeineIntake}
                    placeholder="예: 200"
                    keyboardType="numeric"
                />

                <Text style={styles.label}>생리 주기 (선택사항)</Text>
                <TextInput
                    style={styles.input}
                    value={menstrualCycle}
                    onChangeText={setMenstrualCycle}
                    placeholder="예: day 5"
                />
            </View>

            <TouchableOpacity
                style={[styles.predictButton, predicting && styles.buttonDisabled]}
                onPress={handlePredict}
                disabled={predicting}
            >
                {predicting ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.predictButtonText}>예측하기</Text>
                )}
            </TouchableOpacity>

            {prediction && (
                <View style={styles.resultSection}>
                    <Text style={styles.resultTitle}>예측 결과</Text>

                    <View style={styles.riskBox}>
                        <Text style={styles.riskLabel}>위험도</Text>
                        <View
                            style={[
                                styles.riskBadge,
                                { backgroundColor: getRiskColor(prediction.prediction.riskLevel) },
                            ]}
                        >
                            <Text style={styles.riskBadgeText}>
                                {prediction.prediction.riskLevel.toUpperCase()}
                            </Text>
                        </View>
                        <Text style={styles.probability}>
                            확률: {Math.round(prediction.prediction.probability * 100)}%
                        </Text>
                    </View>

                    <View style={styles.reasonsBox}>
                        <Text style={styles.reasonsTitle}>예상 원인</Text>
                        {prediction.prediction.reasons.map((reason, index) => (
                            <Text key={index} style={styles.reasonItem}>
                                • {reason}
                            </Text>
                        ))}
                    </View>

                    <View style={styles.solutionsBox}>
                        <Text style={styles.solutionsTitle}>해결 방법</Text>
                        {prediction.prediction.solutions.map((solution, index) => (
                            <Text key={index} style={styles.solutionItem}>
                                • {solution}
                            </Text>
                        ))}
                    </View>

                    <View style={styles.weatherBox}>
                        <Text style={styles.weatherTitle}>날씨 정보</Text>
                        <Text style={styles.weatherText}>
                            온도: {prediction.weatherData.temperature}°C
                        </Text>
                        <Text style={styles.weatherText}>
                            습도: {prediction.weatherData.humidity}%
                        </Text>
                        <Text style={styles.weatherText}>
                            기압: {prediction.weatherData.pressure}hPa
                        </Text>
                        <Text style={styles.weatherText}>
                            상태: {prediction.weatherData.condition}
                        </Text>
                    </View>
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>기록 저장</Text>

                <Text style={styles.label}>마이그레인 발생 여부</Text>
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[
                            styles.button,
                            hadMigraine && styles.buttonActive,
                        ]}
                        onPress={() => setHadMigraine(true)}
                    >
                        <Text style={styles.buttonText}>발생</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.button,
                            !hadMigraine && styles.buttonActive,
                        ]}
                        onPress={() => setHadMigraine(false)}
                    >
                        <Text style={styles.buttonText}>미발생</Text>
                    </TouchableOpacity>
                </View>

                {hadMigraine && (
                    <>
                        <Text style={styles.label}>통증 레벨 (0-10)</Text>
                        <TextInput
                            style={styles.input}
                            value={painLevel}
                            onChangeText={setPainLevel}
                            placeholder="예: 7"
                            keyboardType="numeric"
                        />
                    </>
                )}

                <TouchableOpacity
                    style={[styles.saveButton, loading && styles.buttonDisabled]}
                    onPress={handleSaveRecord}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveButtonText}>기록 저장</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    section: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 10,
        marginBottom: 5,
        color: '#666',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 5,
    },
    button: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#e0e0e0',
        alignItems: 'center',
    },
    buttonActive: {
        backgroundColor: '#2196F3',
    },
    buttonText: {
        color: '#333',
        fontWeight: '600',
    },
    predictButton: {
        backgroundColor: '#2196F3',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 20,
    },
    predictButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 15,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    resultSection: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
    },
    resultTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    riskBox: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        alignItems: 'center',
    },
    riskLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    riskBadge: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginBottom: 10,
    },
    riskBadgeText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    probability: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    reasonsBox: {
        backgroundColor: '#fff3cd',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
    },
    reasonsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#856404',
    },
    reasonItem: {
        fontSize: 14,
        color: '#856404',
        marginBottom: 5,
    },
    solutionsBox: {
        backgroundColor: '#d1ecf1',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
    },
    solutionsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#0c5460',
    },
    solutionItem: {
        fontSize: 14,
        color: '#0c5460',
        marginBottom: 5,
    },
    weatherBox: {
        backgroundColor: '#e7f3ff',
        padding: 15,
        borderRadius: 8,
    },
    weatherTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#004085',
    },
    weatherText: {
        fontSize: 14,
        color: '#004085',
        marginBottom: 5,
    },
});

