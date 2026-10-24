# Testing RPS Bash on an Android phone from a Windows PC

Three ways to try the app on your phone without spending a GitHub build, quickest to set up first. Day to day, use the **dev build**: you build it once, then every saved change shows up on the phone in a second or two.

| Way | Command | Needs the PC running? | Rebuild when |
|---|---|---|---|
| Dev build (recommended) | `npm run android` once, then `npm start` | Yes, the phone loads the code from the PC | Native changes only (see below) |
| Expo Go | `npm run go` | Yes | Never, but see its limits below |
| Standalone APK | `npm run apk` | No, it's a normal installed app | Every change you want to see |

## One-time PC setup

1. Install **Node.js 22 LTS** and **Git for Windows**.
2. **JDK 17**: install Eclipse Temurin 17 (adoptium.net) and tick "Set JAVA_HOME" in the installer.
3. **Android Studio**: install it and open it once so it downloads the Android SDK. In *Settings > Languages & Frameworks > Android SDK > SDK Tools*, tick **Android SDK Command-line Tools**, **NDK (Side by side)** and **CMake**, then Apply.
4. **Environment variables** (Start menu > "Edit the system environment variables"):
   - `ANDROID_HOME` = `%LOCALAPPDATA%\Android\Sdk`
   - Add `%LOCALAPPDATA%\Android\Sdk\platform-tools` to `Path`.
5. **Long paths**: the animation libraries compile C++ with very deep folder paths, and Windows' 260-character limit is the most common cause of failed builds. Keep the repos at short paths such as `C:\dev\rps-bash`, and run once in an **administrator** PowerShell:
   ```powershell
   New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name LongPathsEnabled -Value 1 -PropertyType DWORD -Force
   git config --system core.longpaths true
   ```
   Then restart the PC.
6. **Phone**: turn on *Developer options > USB debugging* (tap *Settings > About phone > Build number* seven times to show Developer options), plug it in, accept the prompt on the phone, and check that `adb devices` lists it.
7. **Get the code**:
   ```powershell
   cd C:\dev
   git clone https://github.com/cygTEMP/rps-bash
   ```

Steps 1 to 6 are shared by all the apps; only step 7 is per app.

## Pick the branch to test

Each pull request names its branch at the top of the PR page.

```powershell
cd C:\dev\rps-bash
git fetch
git checkout <branch-name>
git pull
npm ci
```

Run `npm ci` again whenever you switch branches or pull, so the installed libraries match.

## Way 1: Dev build with live reload (recommended)

A dev build is the app itself plus a small launcher that loads the JavaScript from your PC, the way Expo Go does, but with every native piece the app uses built in. It is the only live-reload way that works for every app, including ones with their own native code.

**Build and install it once**, with the phone plugged in over USB:

```powershell
npm run android
```

The first build takes a while (Gradle downloads its dependencies and compiles the native code); later builds are incremental. When it finishes, the app opens on the phone already connected to the PC.

**Every session after that**, no cable needed:

```powershell
npm start
```

Then on the phone either open the app and pick your PC from the list, or scan the QR code in the terminal with the phone's camera. Phone and PC must be on the same Wi-Fi; if they can't see each other, use `npx expo start --tunnel`. Saving a file on the PC reloads the app on the phone. Shake the phone for the developer menu (reload, performance monitor).

**Rebuild the dev build** (run `npm run android` again) only after a change to native parts: a library added to or upgraded in `package.json`, a change to `app.json` (name, icon, permissions, plugins), or a change under `modules/`. Pure code and screen changes never need a rebuild. If a pull request needs a rebuild, its description says so.

## Way 2: Expo Go (no build at all)

Expo Go is a ready-made app from the Play Store that can run any project using only Expo's built-in native libraries.

```powershell
npm run go
```

Scan the QR code with Expo Go.

Limits:
- Each Expo Go release runs one Expo SDK version. These apps are on **SDK 57**, and the Play Store's Expo Go moves to each new SDK (SDK 58 came out on 2026-09-29), so it may say the project is incompatible. Use the dev build, or install the SDK 57 Expo Go APK from expo.dev/go.
- Everything RPS Bash uses, sound and haptics included, is built into Expo Go.

## Way 3: Standalone APK

The same installable test APK that GitHub builds: release mode, so it runs without the PC, built for 64-bit phones only.

```powershell
npm run apk
```

It is copied to `C:\dev\rps-bash\rps-bash.apk` and installed straight onto the phone if one is plugged in. Otherwise copy the APK to the phone and open it, or run `adb install -r rps-bash.apk`.

## How the three fit together on the phone

The dev build, the local APK and GitHub's APKs are all the same app signed with the same debug key, so each one installs over the others without uninstalling and the app's saved settings carry over. Only one is on the phone at a time: installing the APK replaces the dev build, so run `npm run android` again to go back to live reload.

The `android\` folder these commands create is generated and git-ignored. Don't edit it by hand; if a build gets into a strange state, delete it and run the command again.

## Switching between the PC and the iPad

GitHub builds the APK for a pull request only while that pull request carries the **`build-apk`** label. A one-minute check job (tests, typecheck, lint) still runs on every push.

- **On the PC:** leave the label off and test with one of the three ways above. No GitHub build runs.
- **On the iPad:** add the `build-apk` label to the pull request, or ask in the thread ("build it"). Adding the label starts a build, and every push rebuilds while it stays on. Remove it when you're back on the PC.
- **Any branch, by hand:** in the Actions tab, run "Android test APK" and pick the branch.
- Pushes to `main` (merges) still build the `test-build` APK automatically.

## Common problems

| Symptom | Fix |
|---|---|
| Windows Firewall asks about Node.js the first time you run `npm start` | Allow it on private networks, or the phone can't reach the PC. |
| The phone can't find or connect to the PC | Same Wi-Fi on both (not a guest network), then try `npx expo start --tunnel`. |
| Expo Go says the project is incompatible | Use the dev build (Way 1). |
| The dev build opens with a red error about a missing native module | The native parts changed; run `npm run android` again. |
| `SDK location not found` | `ANDROID_HOME` isn't set; reopen PowerShell after setting it. |
| CMake or ninja errors mentioning a long path, or "Filename longer than 260 characters" | Enable long paths (setup step 5) and keep the repo at `C:\dev\rps-bash`. |
| `JAVA_HOME is set to an invalid directory` or the wrong Java version | Point `JAVA_HOME` at the Temurin 17 folder. |
| `adb` doesn't list the phone | Replug, accept the USB debugging prompt, and try another cable (some are charge-only). |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | The installed copy was signed with a different key (for example a Play Store build); uninstall it from the phone first. |
