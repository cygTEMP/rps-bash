// Builds the same installable test APK that the GitHub "Android test APK"
// workflow builds, on this computer, then installs it on a phone plugged in
// over USB (if there is one). Run with `npm run apk`.
//
// The APK is release-mode (runs without the PC), arm64 only like the GitHub
// build, and signed with the debug key, so it installs over a GitHub build or
// a dev build without uninstalling first. It is copied to <slug>.apk in the
// repo root, which git ignores.

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const windows = process.platform === 'win32';

function run(command, args, cwd = root) {
  console.log(`\n> ${command} ${args.join(' ')}`);
  // shell: true lets Windows find npx.cmd and gradlew.bat.
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', shell: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function phoneConnected() {
  const result = spawnSync('adb', ['devices'], { encoding: 'utf8', shell: true });
  if (result.status !== 0) return false;
  return result.stdout.split('\n').slice(1).some((line) => /\tdevice\s*$/.test(line));
}

const { slug } = require(path.join(root, 'app.json')).expo;

run('npx', ['expo', 'prebuild', '--platform', 'android', '--no-install']);
run(windows ? 'gradlew.bat' : './gradlew', ['assembleRelease', '-PreactNativeArchitectures=arm64-v8a'], path.join(root, 'android'));

const apk = path.join(root, `${slug}.apk`);
fs.copyFileSync(path.join(root, 'android/app/build/outputs/apk/release/app-release.apk'), apk);
console.log(`\nAPK: ${apk}`);

if (phoneConnected()) {
  run('adb', ['install', '-r', `"${apk}"`]);
  console.log('Installed on the plugged-in phone.');
} else {
  console.log('No phone found over USB. Plug one in and run `adb install -r` with the path above, or copy the APK to the phone and open it.');
}
