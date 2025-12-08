// src/components/ai/ConsultationRecorder.tsx
"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Square, Loader2, CheckCircle, AlertTriangle } from "lucide-react";

// -----------------------------------------------------------------
// ⚡ FIX: Define all missing global browser types for TypeScript
// This resolves errors 2304 and 2552, plus the previous ones.
// -----------------------------------------------------------------
declare global {
    interface Window {
        webkitSpeechRecognition: any;
    }
    
    // --- Speech Grammar List ---
    interface SpeechGrammarList {
        addFromString(string: string, weight?: number): void;
        addFromUri(uri: string, weight?: number): void;
        readonly length: number;
        [index: number]: SpeechGrammar;
    }
    interface SpeechGrammar {}
    var SpeechGrammarList: {
        prototype: SpeechGrammarList;
        new(): SpeechGrammarList;
    };

    // --- Speech Recognition ---
    interface SpeechRecognition extends EventTarget {
        grammars: SpeechGrammarList;
        interimResults: boolean;
        lang: string;
        maxAlternatives: number;
        continuous: boolean;
        serviceURI: string;

        abort(): void;
        start(): void;
        stop(): void;

        // Events must use the defined types
        onend: ((this: SpeechRecognition, ev: Event) => any) | null;
        onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
        onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
        onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    }
    var SpeechRecognition: {
        prototype: SpeechRecognition;
        new(): SpeechRecognition;
    };

    // --- Speech Recognition Events and Results ---
    interface SpeechRecognitionEvent extends Event {
        readonly resultIndex: number;
        readonly results: SpeechRecognitionResultList;
    }
    interface SpeechRecognitionResultList {
        readonly length: number;
        item(index: number): SpeechRecognitionResult;
        [index: number]: SpeechRecognitionResult;
    }
    interface SpeechRecognitionResult {
        readonly isFinal: boolean;
        readonly length: number;
        item(index: number): SpeechRecognitionAlternative;
        [index: number]: SpeechRecognitionAlternative;
    }
    interface SpeechRecognitionAlternative {
        readonly transcript: string;
        readonly confidence: number;
    }
    
    // --- Speech Recognition Error Event (Fixes Error 2) ---
    interface SpeechRecognitionErrorEvent extends Event {
        readonly error: string;
        readonly message: string;
    }
}
// -----------------------------------------------------------------


// --- Types (You should ideally import AIIntake from a global types file) ---
interface AIIntakeResult {
    problems: any[];
    chronicConditions: any[];
    medications: any[];
    allergies: any[];
    notes: { soapNote: string };
}

interface ConsultationRecorderProps {
    onIntakeProcessed: (data: AIIntakeResult) => void;
    patientId: string; // Used if you want to immediately save to a draft patient record
}

// ----------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------
export default function ConsultationRecorder({ onIntakeProcessed, patientId }: ConsultationRecorderProps) {
    
    // --- State Management ---
    const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'success' | 'error'>('idle');
    const [transcript, setTranscript] = useState('');
    const [apiError, setApiError] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const isListening = status === 'listening';
    const isProcessing = status === 'processing';
    const isReady = status === 'idle' || status === 'error' || status === 'success';

    // --- Speech Recognition Handlers ---
    const startRecording = useCallback(() => {
        if (typeof window === "undefined") return;
        
        // Check for browser support and get the correct constructor
        const SpeechRecognition = 
            (window.SpeechRecognition || window.webkitSpeechRecognition);

        if (!SpeechRecognition) {
            setApiError("Browser does not support Speech Recognition. Use Chrome or Edge.");
            setStatus('error');
            return;
        }

        // Initialize with the correct constructor type
        const recognition: SpeechRecognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = true; // Show results as we speak
        recognition.continuous = true;

        recognition.onstart = () => {
            console.log("Speech recognition started.");
            setStatus('listening');
            setApiError(null);
        };

        // Use the declared global type for the event parameter
        recognition.onresult = (event: SpeechRecognitionEvent) => { 
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcriptPart = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcriptPart + ' ';
                }
            }
            
            // Append final transcript
            setTranscript(prev => {
                const newTranscript = (prev + finalTranscript).trim();
                // Simple logic to prevent immediate re-appending of the same final result
                return newTranscript.endsWith(finalTranscript.trim()) ? newTranscript : prev + finalTranscript;
            });
        };

        // Use the declared global type for the event parameter
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error("Speech recognition error:", event.error);
            // If it's a 'no-speech' error while actively listening, don't stop/reset state fully
            if (event.error !== 'no-speech' && status === 'listening') {
                setApiError(`Voice input error: ${event.error}.`);
                setStatus('error');
            }
        };

        recognition.onend = () => {
             // If we stopped the recording manually, status will be 'processing' or 'idle'.
             // If it ended unexpectedly, it will still be 'listening', so we set it to idle.
            if (status === 'listening') {
                 setStatus('idle');
            }
        };

        recognitionRef.current = recognition;
        recognition.start();

    }, [status]);


    const stopRecording = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        
        // Get the current transcript immediately after stopping
        const finalTranscript = transcript.trim();

        if (finalTranscript.length > 0) {
            processTranscript(finalTranscript);
        } else {
            setStatus('idle');
            setApiError('No speech was captured.');
        }
    }, [transcript]); // Dependency on transcript ensures we capture the latest text


    // --- API Processing Handler ---
    const processTranscript = async (text: string) => {
        setStatus('processing');
        setApiError(null);

        try {
            const res = await fetch("/api/ai/consult-intake", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transcript: text, patientId }),
            });

            const json = await res.json();

            if (!res.ok || json.success === false) {
                throw new Error(json.error || "Failed to process transcript.");
            }

            // Success: pass structured data to the parent component
            onIntakeProcessed(json.data as AIIntakeResult);
            setStatus('success');
            setTranscript(''); // Clear transcript after successful processing

        } catch (err: any) {
            console.error("AI Intake Processing Error:", err);
            setApiError(err.message || "Failed to structure clinical data.");
            setStatus('error');
            // Keep the transcript for manual copying if processing fails
        }
    };


    // --- Render Logic ---
    return (
        <Card className="bg-white border border-teal-100 shadow-sm rounded-xl">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg text-teal-700 flex items-center gap-2">
                    <Mic className="h-5 w-5" />
                    AI Voice Intake
                </CardTitle>
                <CardDescription className="text-xs">
                    Start recording the patient consultation to automatically generate structured problems, meds, and a SOAP note.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Status Indicator */}
                <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">
                        Current Status:
                    </span>
                    <BadgeStatus status={status} />
                </div>
                
                {/* Transcript Area */}
                <Textarea
                    placeholder={
                        isListening 
                            ? "Listening... speak clearly. Press STOP when finished." 
                            : "Transcript of consultation will appear here."
                    }
                    rows={8}
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    disabled={isProcessing}
                    className={`text-sm ${isListening ? 'border-teal-400 focus:border-teal-600' : ''}`}
                />

                {/* Control Buttons */}
                <div className="flex justify-between gap-2">
                    <Button
                        type="button"
                        onClick={startRecording}
                        disabled={isListening || isProcessing}
                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                    >
                        <Mic className="mr-2 h-4 w-4" />
                        {isListening ? "Listening..." : "Start Consult"}
                    </Button>

                    <Button
                        type="button"
                        onClick={stopRecording}
                        disabled={!isListening || isProcessing}
                        variant="destructive"
                        className="w-28 bg-red-600 hover:bg-red-700"
                    >
                        {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Square className="h-4 w-4" />
                        )}
                        &nbsp;Stop
                    </Button>
                </div>

                {/* Error/Success Feedback */}
                {apiError && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        **Processing Error:** {apiError}
                    </p>
                )}
                {status === 'success' && (
                    <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded p-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        **Success!** Clinical data structured and ready for review.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

// Helper component for status display
const BadgeStatus = ({ status }: { status: string }) => {
    switch (status) {
        case 'listening':
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 animate-pulse">
                    <Mic className="h-3 w-3" /> Recording
                </span>
            );
        case 'processing':
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    <Loader2 className="h-3 w-3 animate-spin" /> Analyzing
                </span>
            );
        case 'success':
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                    <CheckCircle className="h-3 w-3" /> Processed
                </span>
            );
        case 'error':
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    <AlertTriangle className="h-3 w-3" /> Error
                </span>
            );
        case 'idle':
        default:
            return (
                <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">
                    Ready
                </span>
            );
    }
};