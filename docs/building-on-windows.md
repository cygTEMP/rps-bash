# Building the RPS Bash APK on a Windows PC

This covers two ways to try the app from a Windows PC without spending a GitHub Actions build, plus how to switch between PC and iPad.

## Option 1: Expo Go (no build at all, fastest)

Every native library RPS Bash uses ships inside the Expo Go app, so day-to-day testing needs no APK.

1. Install **Node.js 22 LTS** and **Git for Windows**.
2. On the Android phone, install **Expo Go** from the Play Store.
3. In PowerShell:
   ```powershell
   cd C:\dev
   git clone https://github.com/cygTEMP/rps-bash
   cd rps-bash
   git checkout <branch>    # a pull request's branch, or skip this to stay on main
   npm ci
   npx expo start
   ```
4. Scan the QR code with Expo Go. The phone and PC must be on the same Wi-Fi network; if they can't see each other, use `npx expo start --tunnel`.

Saving a file on the PC reloads the app on the phone within a second or two. Sound and haptics work in Expo Go.

## Option 2: A real APK built on the PC (same as the GitHub build)

Use this when you want an installed app that runs without the PC, which is what GitHub builds today.

### One-time setup

1. **JDK 17**: install Eclipse Temurin 17 (adoptium.net) and tick "Set JAVA_HOME" in the installer.
2. **Android Studio**: install it and open it once so it downloads the Android SDK. In *Settings > Languages & Frameworks > Android SDK > SDK Tools*, tick **Android SDK Command-line Tools**, **NDK (Side by side)** and **CMake**, then Apply.
3. **Environment variables** (Start menu > "Edit the system environment variables"):
   - `ANDROID_HOME` = `%LOCALAPPDATA%\Android\Sdk`
   - Add `%LOCALAPPDATA%\Android\Sdk\platform-tools` to `Path`.
4. **Long paths**: the animation libraries compile C++ with very deep folder paths, and Windows' 260-character limit is the most common cause of failed builds. Keep the repo at a short path such as `C:\dev\rps-bash`, and run once in an **administrator** PowerShell:
   ```powershell
   New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name LongPathsEnabled -Value 1 -PropertyType DWORD -Force
   git config --system core.longpaths true
   ```
   Then restart the PC.
5. **Phone**: turn on *Developer options > USB debugging*, plug it in, accept the prompt on the phone, and check that `adb devices` lists it.

### Each build

```powershell
cd C:\dev\rps-bash
git pull
npm ci
npx expo run:android --variant release
```

That generates the `android\` folder, builds a release APK and installs it on the plugged-in phone. The first build takes a while (Gradle downloads its dependencies and compiles the native code); later builds are much faster because they're incremental.

To build only for 64-bit phones, as GitHub does, which roughly halves the time:

```powershell
npx expo prebuild --platform android
cd android
.\gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a
```

The APK lands in `android\app\build\outputs\apk\release\app-release.apk`. Install it with `adb install -r android\app\build\outputs\apk\release\app-release.apk`, or copy it to the phone and open it.

Local and GitHub APKs are signed with the same debug key from Expo's template, so either one installs over the other without uninstalling first.

The `android\` folder is generated and git-ignored. Don't edit it by hand; if a build gets into a strange state, delete it and run the command again.

## Switching between the PC and the iPad

GitHub builds the APK for a pull request only while that pull request carries the **`build-apk`** label. A one-minute check job (tests, typecheck, lint) still runs on every push.

- **On the PC:** leave the label off. Pull the branch and test with Expo Go or a local APK. No GitHub build runs.
- **On the iPad:** add the `build-apk` label to the pull request, or ask in the thread ("build it"). Adding the label starts a build, and every push rebuilds while it stays on. Remove it when you're back on the PC.
- **Any branch, by hand:** in the Actions tab, run "Android test APK" and pick the branch.
- Pushes to `main` (merges) still build the `test-build` APK automatically.

## Common problems

| Symptom | Fix |
|---|---|
| `SDK location not found` | `ANDROID_HOME` isn't set; reopen PowerShell after setting it. |
| CMake or ninja errors mentioning a long path, or "Filename longer than 260 characters" | Enable long paths (step 4) and move the repo to `C:\dev\rps-bash`. |
| `JAVA_HOME is set to an invalid directory` or the wrong Java version | Point `JAVA_HOME` at the Temurin 17 folder. |
| `adb` doesn't list the phone | Replug, accept the USB debugging prompt, and try another cable (some are charge-only). |
| Expo Go can't connect | Use `npx expo start --tunnel`. |
