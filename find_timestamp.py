import speech_recognition as sr
from pydub import AudioSegment
import os
import math

audio_path = "public/uploads/kitab_song.mp3"
sound = AudioSegment.from_mp3(audio_path)

# chunk length in ms
chunk_length_ms = 10000 # 10 seconds
chunks = math.ceil(len(sound) / chunk_length_ms)

r = sr.Recognizer()

found_timestamp = -1

for i in range(chunks):
    start_ms = i * chunk_length_ms
    end_ms = start_ms + chunk_length_ms
    chunk = sound[start_ms:end_ms]
    chunk.export("chunk.wav", format="wav")
    
    with sr.AudioFile("chunk.wav") as source:
        audio = r.record(source)
        try:
            text = r.recognize_google(audio, language="hi-IN")
            print(f"[{start_ms/1000} - {end_ms/1000}] {text}")
            if "राखी" in text or "राजा" in text or "किताब" in text or "रजा" in text or "tenu" in text.lower() or "raja" in text.lower() or "kitab" in text.lower() or "likhu" in text.lower() or "likho" in text.lower() or "raaja" in text.lower():
                print(f"FOUND MATCH AT ~{start_ms/1000} seconds!")
                # check if it's the right phrase roughly
        except sr.UnknownValueError:
            pass
        except sr.RequestError as e:
            print("Sphinx error; {0}".format(e))

if os.path.exists("chunk.wav"):
    os.remove("chunk.wav")
