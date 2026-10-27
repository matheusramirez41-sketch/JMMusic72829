package com.aurasound.audio;

import android.content.Context;
import android.media.audiofx.AudioEffect;
import android.media.audiofx.BassBoost;
import android.media.audiofx.Equalizer;
import android.media.audiofx.LoudnessEnhancer;
import android.media.audiofx.Virtualizer;
import android.media.audiofx.Visualizer;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.util.Log;
import android.widget.CompoundButton;

import java.util.Arrays;

/**
 * AudioController.java
 * 
 * Controlador avanzado de procesamiento de audio en tiempo real para Android.
 * Vinculado al AudioSessionId del reproductor (MediaPlayer, ExoPlayer o AudioTrack).
 * 
 * Características principales:
 * 1. Ecualizador paramétrico de 10 bandas (31 Hz, 62 Hz, 125 Hz, 250 Hz, 500 Hz, 1 kHz, 2 kHz, 4 kHz, 8 kHz, 16 kHz)
 *    utilizando android.media.audiofx.Equalizer.
 * 2. Refuerzo de graves dinámico (BassBoost).
 * 3. Audio espacial 3D inmersivo (Virtualizer).
 * 4. Nivelador y amplificador de ganancia/volumen (LoudnessEnhancer).
 * 5. Captura gráfica de formas de onda y FFT para visualizadores espectrales (Visualizer).
 * 6. Motor háptico de vibración sincronizado con sub-graves y frecuencias bajas (Haptic Bass Engine).
 * 7. Métodos booleanos independientes con soporte directo para interruptores XML (Switch / SwitchCompat / MaterialSwitch).
 */
public class AudioController {

    private static final String TAG = "AuraAudioController";

    // 10 Frecuencias objetivo estándar de la industria (en Hertz)
    public static final int[] TARGET_FREQUENCIES_HZ = {
            31,     // Sub-Bass
            62,     // Deep Bass
            125,    // Mid-Bass
            250,    // Low-Mids
            500,    // Mids
            1000,   // High-Mids (1 kHz)
            2000,   // Presence (2 kHz)
            4000,   // Clarity / Vocals (4 kHz)
            8000,   // Treble (8 kHz)
            16000   // Air / Brilliance (16 kHz)
    };

    // Efectos nativos de Android vinculados a la sesión de audio
    private Equalizer mEqualizer;
    private BassBoost mBassBoost;
    private Virtualizer mVirtualizer;
    private LoudnessEnhancer mLoudnessEnhancer;
    private Visualizer mVisualizer;

    // Servicios del sistema Android
    private Context mContext;
    private Vibrator mVibrator;
    private int mAudioSessionId = 0;

    // Estados de activación independientes (controlables desde XML / Switch)
    private boolean mEqualizerEnabled = true;
    private boolean mBassBoostEnabled = false;
    private boolean mVirtualizerEnabled = false;
    private boolean mLoudnessEnhancerEnabled = false;
    private boolean mVisualizerEnabled = false;
    private boolean mHapticBassEnabled = false;

    // Valores y parámetros configurados
    private final short[] mTenBandGains = new short[10]; // Ganancia en milibelios (mB) para cada una de las 10 bandas
    private short mBassBoostStrength = 500;              // Rango: 0 a 1000
    private short mVirtualizerStrength = 500;            // Rango: 0 a 1000
    private int mLoudnessGainMilliBels = 400;             // Rango: 0 a 1500 mB (0 a 15 dB)
    private short mMinBandLevel = -1500;                 // -15 dB por defecto
    private short mMaxBandLevel = 1500;                  // +15 dB por defecto

    // Mapeo entre las 10 frecuencias de la app y las bandas físicas disponibles en el DSP del dispositivo
    private short[] mHardwareBandMapping = new short[10];

    // Motor háptico de graves (Haptic Bass Feedback)
    private long mLastHapticTimeMs = 0;
    private int mHapticThreshold = 55;                    // Umbral de energía FFT para disparar vibración (0-128)
    private int mHapticDurationMs = 35;                   // Duración del pulso háptico en milisegundos
    private int mHapticCooldownMs = 90;                   // Enfriamiento mínimo entre pulsos de vibración

    // Listener para datos de visualización gráfica en tiempo real
    private OnVisualizerDataListener mVisualizerDataListener;

    /**
     * Interfaz de callback para renderizado de espectro gráfico en UI.
     */
    public interface OnVisualizerDataListener {
        void onWaveFormDataCapture(byte[] waveform);
        void onFftDataCapture(byte[] fft);
    }

    /**
     * Constructor por defecto.
     */
    public AudioController() {
        Arrays.fill(mTenBandGains, (short) 0);
        Arrays.fill(mHardwareBandMapping, (short) -1);
    }

    /**
     * Inicializa y vincula todos los efectos al AudioSessionId del reproductor.
     *
     * @param context Contexto de la aplicación.
     * @param audioSessionId ID de la sesión de audio obtenido de MediaPlayer.getAudioSessionId()
     *                       o ExoPlayer.getAudioSessionId().
     */
    public void init(Context context, int audioSessionId) {
        this.mContext = context.getApplicationContext();
        this.mAudioSessionId = audioSessionId;

        initVibrator();
        setupEqualizer();
        setupBassBoost();
        setupVirtualizer();
        setupLoudnessEnhancer();
        setupVisualizer();

        Log.i(TAG, "AudioController inicializado correctamente con AudioSessionId: " + audioSessionId);
    }

    /**
     * Re-vincula el controlador a una nueva sesión de audio (por ejemplo, al cambiar de canción).
     */
    public void attachAudioSession(int audioSessionId) {
        if (this.mAudioSessionId == audioSessionId && mEqualizer != null) {
            return;
        }
        release();
        if (mContext != null) {
            init(mContext, audioSessionId);
        }
    }

    // =========================================================================
    // INICIALIZACIÓN DE EFECTOS
    // =========================================================================

    private void initVibrator() {
        if (mContext == null) return;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                VibratorManager vibratorManager = (VibratorManager) mContext.getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
                if (vibratorManager != null) {
                    mVibrator = vibratorManager.getDefaultVibrator();
                }
            } else {
                mVibrator = (Vibrator) mContext.getSystemService(Context.VIBRATOR_SERVICE);
            }
        } catch (Exception e) {
            Log.w(TAG, "Error al inicializar el servicio de vibrador háptico: " + e.getMessage());
        }
    }

    private void setupEqualizer() {
        try {
            mEqualizer = new Equalizer(0, mAudioSessionId);
            short[] range = mEqualizer.getBandLevelRange();
            if (range != null && range.length >= 2) {
                mMinBandLevel = range[0];
                mMaxBandLevel = range[1];
            }

            short numHardwareBands = mEqualizer.getNumberOfBands();
            Log.d(TAG, "Hardware Equalizer bandas disponibles: " + numHardwareBands);

            // Mapear cada una de las 10 frecuencias nominales a la banda más cercana del chip DSP
            for (int i = 0; i < TARGET_FREQUENCIES_HZ.length; i++) {
                int targetHz = TARGET_FREQUENCIES_HZ[i];
                int targetMilliHz = targetHz * 1000;
                short closestBand = 0;
                int minDiff = Integer.MAX_VALUE;

                for (short b = 0; b < numHardwareBands; b++) {
                    int centerMilliHz = mEqualizer.getCenterFreq(b);
                    int diff = Math.abs(centerMilliHz - targetMilliHz);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestBand = b;
                    }
                }
                mHardwareBandMapping[i] = closestBand;
            }

            // Aplicar ganancias almacenadas
            applyTenBandGains();
            mEqualizer.setEnabled(mEqualizerEnabled);
        } catch (Exception e) {
            Log.e(TAG, "Fallo al inicializar Equalizer nativo: " + e.getMessage());
            mEqualizer = null;
        }
    }

    private void setupBassBoost() {
        try {
            mBassBoost = new BassBoost(0, mAudioSessionId);
            if (mBassBoost.getStrengthSupported()) {
                mBassBoost.setStrength(mBassBoostStrength);
            }
            mBassBoost.setEnabled(mBassBoostEnabled);
        } catch (Exception e) {
            Log.w(TAG, "Fallo al inicializar BassBoost: " + e.getMessage());
            mBassBoost = null;
        }
    }

    private void setupVirtualizer() {
        try {
            mVirtualizer = new Virtualizer(0, mAudioSessionId);
            if (mVirtualizer.getStrengthSupported()) {
                mVirtualizer.setStrength(mVirtualizerStrength);
            }
            mVirtualizer.setEnabled(mVirtualizerEnabled);
        } catch (Exception e) {
            Log.w(TAG, "Fallo al inicializar Virtualizer 3D: " + e.getMessage());
            mVirtualizer = null;
        }
    }

    private void setupLoudnessEnhancer() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                mLoudnessEnhancer = new LoudnessEnhancer(mAudioSessionId);
                mLoudnessEnhancer.setTargetGain(mLoudnessGainMilliBels);
                mLoudnessEnhancer.setEnabled(mLoudnessEnhancerEnabled);
            }
        } catch (Exception e) {
            Log.w(TAG, "Fallo al inicializar LoudnessEnhancer: " + e.getMessage());
            mLoudnessEnhancer = null;
        }
    }

    private void setupVisualizer() {
        try {
            mVisualizer = new Visualizer(mAudioSessionId);
            mVisualizer.setCaptureSize(Visualizer.getCaptureSizeRange()[1]); // Máxima resolución de captura
            mVisualizer.setDataCaptureListener(new Visualizer.OnDataCaptureListener() {
                @Override
                public void onWaveFormDataCapture(Visualizer visualizer, byte[] waveform, int samplingRate) {
                    if (mVisualizerDataListener != null && mVisualizerEnabled) {
                        mVisualizerDataListener.onWaveFormDataCapture(waveform);
                    }
                }

                @Override
                public void onFftDataCapture(Visualizer visualizer, byte[] fft, int samplingRate) {
                    if (mVisualizerDataListener != null && mVisualizerEnabled) {
                        mVisualizerDataListener.onFftDataCapture(fft);
                    }
                    // Si el motor háptico está activo, analiza las frecuencias sub-graves en tiempo real
                    if (mHapticBassEnabled) {
                        processHapticBass(fft);
                    }
                }
            }, Visualizer.getMaxCaptureRate() / 2, true, true);

            mVisualizer.setEnabled(mVisualizerEnabled || mHapticBassEnabled);
        } catch (Exception e) {
            Log.w(TAG, "Visualizer no disponible (¿falta permiso RECORD_AUDIO?): " + e.getMessage());
            mVisualizer = null;
        }
    }

    // =========================================================================
    // CONTROL BOOLEANO INDEPENDIENTE PARA INTERFAZ XML / SWITCHES
    // =========================================================================

    /**
     * 1. Activa o desactiva el ecualizador de 10 bandas.
     * Compatible directamente con interruptores XML (Switch / SwitchCompat / MaterialSwitch).
     */
    public void setEqualizerEnabled(boolean enable) {
        this.mEqualizerEnabled = enable;
        if (mEqualizer != null) {
            try {
                mEqualizer.setEnabled(enable);
                Log.d(TAG, "Equalizer 10 bandas " + (enable ? "ACTIVADO" : "DESACTIVADO"));
            } catch (Exception e) {
                Log.e(TAG, "Error al cambiar estado de Equalizer: " + e.getMessage());
            }
        }
    }

    public boolean isEqualizerEnabled() {
        return mEqualizer != null ? mEqualizer.getEnabled() : mEqualizerEnabled;
    }

    /**
     * Método para asignar directamente desde XML android:onCheckedChanged.
     */
    public void onEqualizerSwitchChanged(CompoundButton buttonView, boolean isChecked) {
        setEqualizerEnabled(isChecked);
    }

    /**
     * 2. Activa o desactiva el refuerzo de graves (BassBoost).
     */
    public void setBassBoostEnabled(boolean enable) {
        this.mBassBoostEnabled = enable;
        if (mBassBoost != null) {
            try {
                mBassBoost.setEnabled(enable);
                Log.d(TAG, "BassBoost " + (enable ? "ACTIVADO" : "DESACTIVADO"));
            } catch (Exception e) {
                Log.e(TAG, "Error al cambiar estado de BassBoost: " + e.getMessage());
            }
        }
    }

    public boolean isBassBoostEnabled() {
        return mBassBoost != null ? mBassBoost.getEnabled() : mBassBoostEnabled;
    }

    public void onBassBoostSwitchChanged(CompoundButton buttonView, boolean isChecked) {
        setBassBoostEnabled(isChecked);
    }

    /**
     * 3. Activa o desactiva el audio espacial 3D inmersivo (Virtualizer).
     */
    public void setVirtualizerEnabled(boolean enable) {
        this.mVirtualizerEnabled = enable;
        if (mVirtualizer != null) {
            try {
                mVirtualizer.setEnabled(enable);
                Log.d(TAG, "Virtualizer 3D " + (enable ? "ACTIVADO" : "DESACTIVADO"));
            } catch (Exception e) {
                Log.e(TAG, "Error al cambiar estado de Virtualizer: " + e.getMessage());
            }
        }
    }

    public boolean isVirtualizerEnabled() {
        return mVirtualizer != null ? mVirtualizer.getEnabled() : mVirtualizerEnabled;
    }

    public void onVirtualizerSwitchChanged(CompoundButton buttonView, boolean isChecked) {
        setVirtualizerEnabled(isChecked);
    }

    /**
     * 4. Activa o desactiva el nivelador de volumen y ganancia (LoudnessEnhancer).
     */
    public void setLoudnessEnhancerEnabled(boolean enable) {
        this.mLoudnessEnhancerEnabled = enable;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT && mLoudnessEnhancer != null) {
            try {
                mLoudnessEnhancer.setEnabled(enable);
                Log.d(TAG, "LoudnessEnhancer " + (enable ? "ACTIVADO" : "DESACTIVADO"));
            } catch (Exception e) {
                Log.e(TAG, "Error al cambiar estado de LoudnessEnhancer: " + e.getMessage());
            }
        }
    }

    public boolean isLoudnessEnhancerEnabled() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT && mLoudnessEnhancer != null) {
            return mLoudnessEnhancer.getEnabled();
        }
        return mLoudnessEnhancerEnabled;
    }

    public void onLoudnessEnhancerSwitchChanged(CompoundButton buttonView, boolean isChecked) {
        setLoudnessEnhancerEnabled(isChecked);
    }

    /**
     * 5. Activa o desactiva la captura gráfica FFT para visualizadores (Visualizer).
     */
    public void setVisualizerEnabled(boolean enable) {
        this.mVisualizerEnabled = enable;
        updateVisualizerState();
        Log.d(TAG, "Visualizer FFT " + (enable ? "ACTIVADO" : "DESACTIVADO"));
    }

    public boolean isVisualizerEnabled() {
        return mVisualizerEnabled;
    }

    public void onVisualizerSwitchChanged(CompoundButton buttonView, boolean isChecked) {
        setVisualizerEnabled(isChecked);
    }

    /**
     * 6. Activa o desactiva el motor de respuesta háptica (vibración en graves).
     */
    public void setHapticBassEnabled(boolean enable) {
        this.mHapticBassEnabled = enable;
        updateVisualizerState();
        Log.d(TAG, "Respuesta Háptica en Graves " + (enable ? "ACTIVADA" : "DESACTIVADA"));
    }

    public boolean isHapticBassEnabled() {
        return mHapticBassEnabled;
    }

    public void onHapticBassSwitchChanged(CompoundButton buttonView, boolean isChecked) {
        setHapticBassEnabled(isChecked);
    }

    /**
     * Sincroniza el estado del componente Visualizer de Android según los requerimientos
     * de visualización gráfica o motor háptico.
     */
    private void updateVisualizerState() {
        if (mVisualizer != null) {
            try {
                boolean shouldBeActive = mVisualizerEnabled || mHapticBassEnabled;
                if (mVisualizer.getEnabled() != shouldBeActive) {
                    mVisualizer.setEnabled(shouldBeActive);
                }
            } catch (Exception e) {
                Log.w(TAG, "Error al actualizar estado del Visualizer: " + e.getMessage());
            }
        }
    }

    // =========================================================================
    // CONTROL DE PARÁMETROS DEL ECUALIZADOR DE 10 BANDAS
    // =========================================================================

    /**
     * Modifica la ganancia de una de las 10 bandas específicas (índices 0 a 9).
     *
     * @param bandIndex0to9 Índice de la banda (0 = 31Hz, 1 = 62Hz, ..., 9 = 16kHz).
     * @param levelMillibels Nivel en milibelios (por ejemplo, de -1500 mB a +1500 mB).
     */
    public void setBandLevel10(int bandIndex0to9, short levelMillibels) {
        if (bandIndex0to9 < 0 || bandIndex0to9 >= 10) return;

        // Limitar dentro del rango soportado por el hardware
        levelMillibels = (short) Math.max(mMinBandLevel, Math.min(mMaxBandLevel, levelMillibels));
        mTenBandGains[bandIndex0to9] = levelMillibels;

        if (mEqualizer != null) {
            try {
                short hwBand = mHardwareBandMapping[bandIndex0to9];
                if (hwBand >= 0 && hwBand < mEqualizer.getNumberOfBands()) {
                    mEqualizer.setBandLevel(hwBand, levelMillibels);
                }
            } catch (Exception e) {
                Log.w(TAG, "Error al aplicar nivel de banda " + bandIndex0to9 + ": " + e.getMessage());
            }
        }
    }

    /**
     * Obtiene la ganancia actual de una de las 10 bandas.
     */
    public short getBandLevel10(int bandIndex0to9) {
        if (bandIndex0to9 < 0 || bandIndex0to9 >= 10) return 0;
        return mTenBandGains[bandIndex0to9];
    }

    /**
     * Establece la ganancia buscando por frecuencia exacta en Hertz.
     */
    public void setFrequencyLevel(int frequencyHz, short levelMillibels) {
        for (int i = 0; i < TARGET_FREQUENCIES_HZ.length; i++) {
            if (TARGET_FREQUENCIES_HZ[i] == frequencyHz) {
                setBandLevel10(i, levelMillibels);
                return;
            }
        }
    }

    /**
     * Aplica simultáneamente todas las 10 ganancias al ecualizador nativo.
     */
    public void setAllTenBands(short[] gainsMillibels) {
        if (gainsMillibels == null || gainsMillibels.length != 10) return;
        System.arraycopy(gainsMillibels, 0, mTenBandGains, 0, 10);
        applyTenBandGains();
    }

    private void applyTenBandGains() {
        if (mEqualizer == null) return;
        try {
            for (int i = 0; i < 10; i++) {
                short hwBand = mHardwareBandMapping[i];
                if (hwBand >= 0 && hwBand < mEqualizer.getNumberOfBands()) {
                    mEqualizer.setBandLevel(hwBand, mTenBandGains[i]);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error al sincronizar las 10 bandas con el DSP: " + e.getMessage());
        }
    }

    public short getMinBandLevel() {
        return mMinBandLevel;
    }

    public short getMaxBandLevel() {
        return mMaxBandLevel;
    }

    public short[] getTenBandGains() {
        return Arrays.copyOf(mTenBandGains, mTenBandGains.length);
    }

    // =========================================================================
    // AJUSTE DE PARÁMETROS DE EFECTOS
    // =========================================================================

    /**
     * Ajusta la intensidad del refuerzo de graves (0 a 1000).
     */
    public void setBassBoostStrength(short strength) {
        this.mBassBoostStrength = (short) Math.max(0, Math.min(1000, strength));
        if (mBassBoost != null) {
            try {
                if (mBassBoost.getStrengthSupported()) {
                    mBassBoost.setStrength(mBassBoostStrength);
                }
            } catch (Exception e) {
                Log.w(TAG, "Error al configurar intensidad de BassBoost: " + e.getMessage());
            }
        }
    }

    public short getBassBoostStrength() {
        if (mBassBoost != null && mBassBoost.getStrengthSupported()) {
            return mBassBoost.getRoundedStrength();
        }
        return mBassBoostStrength;
    }

    /**
     * Ajusta la intensidad del audio espacial 3D Virtualizer (0 a 1000).
     */
    public void setVirtualizerStrength(short strength) {
        this.mVirtualizerStrength = (short) Math.max(0, Math.min(1000, strength));
        if (mVirtualizer != null) {
            try {
                if (mVirtualizer.getStrengthSupported()) {
                    mVirtualizer.setStrength(mVirtualizerStrength);
                }
            } catch (Exception e) {
                Log.w(TAG, "Error al configurar intensidad de Virtualizer: " + e.getMessage());
            }
        }
    }

    public short getVirtualizerStrength() {
        if (mVirtualizer != null && mVirtualizer.getStrengthSupported()) {
            return mVirtualizer.getRoundedStrength();
        }
        return mVirtualizerStrength;
    }

    /**
     * Ajusta la ganancia del LoudnessEnhancer en milibelios (mB).
     * Ejemplo: 300 mB = +3.0 dB de ganancia acústica.
     */
    public void setLoudnessGain(int gainMilliBels) {
        this.mLoudnessGainMilliBels = Math.max(0, Math.min(2000, gainMilliBels));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT && mLoudnessEnhancer != null) {
            try {
                mLoudnessEnhancer.setTargetGain(mLoudnessGainMilliBels);
            } catch (Exception e) {
                Log.w(TAG, "Error al configurar LoudnessGain: " + e.getMessage());
            }
        }
    }

    public int getLoudnessGain() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT && mLoudnessEnhancer != null) {
            return (int) mLoudnessEnhancer.getTargetGain();
        }
        return mLoudnessGainMilliBels;
    }

    // =========================================================================
    // MOTOR DE RESPUESTA HÁPTICA (VIBRACIÓN EN GRAVES)
    // =========================================================================

    /**
     * Procesa los datos FFT espectrales en tiempo real para detectar golpes de bombo y sub-graves.
     * Si la energía en bajas frecuencias supera el umbral, genera una vibración háptica precisa.
     */
    private void processHapticBass(byte[] fft) {
        if (mVibrator == null || !mVibrator.hasVibrator()) return;
        if (fft == null || fft.length < 8) return;

        long now = System.currentTimeMillis();
        if (now - mLastHapticTimeMs < mHapticCooldownMs) {
            return; // Respetar tiempo de enfriamiento para no sobrecargar el actuador háptico
        }

        // Analizar la magnitud de los primeros contenedores FFT (frecuencias entre 20 Hz y 120 Hz)
        // Estructura FFT de Android: byte 0 = DC, byte 1 = Nyquist, [2k, 2k+1] = real e imaginario
        int bassEnergySum = 0;
        int binsToAnalyze = Math.min(4, fft.length / 2 - 1);

        for (int i = 1; i <= binsToAnalyze; i++) {
            byte r = fft[2 * i];
            byte im = fft[2 * i + 1];
            int magnitude = (int) Math.hypot(r, im);
            bassEnergySum += magnitude;
        }

        int avgBassEnergy = bassEnergySum / binsToAnalyze;

        if (avgBassEnergy >= mHapticThreshold) {
            mLastHapticTimeMs = now;
            triggerHapticPulse(avgBassEnergy);
        }
    }

    private void triggerHapticPulse(int bassEnergy) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                // Escalar amplitud háptica entre 50 y 255 de forma proporcional al golpe de graves
                int amplitude = Math.min(255, Math.max(60, (bassEnergy * 255) / 110));
                VibrationEffect effect = VibrationEffect.createOneShot(mHapticDurationMs, amplitude);
                mVibrator.vibrate(effect);
            } else {
                mVibrator.vibrate(mHapticDurationMs);
            }
        } catch (Exception e) {
            Log.w(TAG, "Excepción en pulso háptico: " + e.getMessage());
        }
    }

    public void setHapticThreshold(int threshold) {
        this.mHapticThreshold = Math.max(20, Math.min(120, threshold));
    }

    public int getHapticThreshold() {
        return mHapticThreshold;
    }

    public void setHapticDurationMs(int durationMs) {
        this.mHapticDurationMs = Math.max(15, Math.min(100, durationMs));
    }

    public void setOnVisualizerDataListener(OnVisualizerDataListener listener) {
        this.mVisualizerDataListener = listener;
    }

    // =========================================================================
    // LIBERACIÓN DE RECURSOS DEL SISTEMA
    // =========================================================================

    /**
     * Libera todos los efectos de audio y observadores para prevenir fugas de memoria
     * o bloqueos en el servidor AudioFlinger de Android.
     */
    public void release() {
        if (mVisualizer != null) {
            try {
                mVisualizer.setEnabled(false);
                mVisualizer.release();
            } catch (Exception ignored) {}
            mVisualizer = null;
        }

        if (mEqualizer != null) {
            try {
                mEqualizer.setEnabled(false);
                mEqualizer.release();
            } catch (Exception ignored) {}
            mEqualizer = null;
        }

        if (mBassBoost != null) {
            try {
                mBassBoost.setEnabled(false);
                mBassBoost.release();
            } catch (Exception ignored) {}
            mBassBoost = null;
        }

        if (mVirtualizer != null) {
            try {
                mVirtualizer.setEnabled(false);
                mVirtualizer.release();
            } catch (Exception ignored) {}
            mVirtualizer = null;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT && mLoudnessEnhancer != null) {
            try {
                mLoudnessEnhancer.setEnabled(false);
                mLoudnessEnhancer.release();
            } catch (Exception ignored) {}
            mLoudnessEnhancer = null;
        }

        Log.i(TAG, "AudioController liberado correctamente.");
    }
}
