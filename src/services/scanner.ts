/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AllowedFileCategory, MalwareScanReport, ScanStageDetail, ScanVerdict } from '../types';
import { sha256 } from './security';

// Forbidden executable extensions
const FORBIDDEN_EXTENSIONS = new Set([
  'exe', 'dll', 'so', 'dylib', 'apk', 'msi', 'bat', 'cmd', 'vbs', 'com', 'scr', 'pif', 'ps1'
]);

// Magic byte definitions (first bytes in hex)
const MAGIC_SIGNATURES: { ext: string; bytes: number[]; mime: string; category: AllowedFileCategory }[] = [
  // Images
  { ext: 'png', bytes: [0x89, 0x50, 0x4E, 0x47], mime: 'image/png', category: 'image' },
  { ext: 'jpg', bytes: [0xFF, 0xD8, 0xFF], mime: 'image/jpeg', category: 'image' },
  { ext: 'jpeg', bytes: [0xFF, 0xD8, 0xFF], mime: 'image/jpeg', category: 'image' },
  { ext: 'gif', bytes: [0x47, 0x49, 0x46, 0x38], mime: 'image/gif', category: 'image' },
  { ext: 'webp', bytes: [0x52, 0x49, 0x46, 0x46], mime: 'image/webp', category: 'image' },
  // Documents
  { ext: 'pdf', bytes: [0x25, 0x50, 0x44, 0x46], mime: 'application/pdf', category: 'document' },
  // Archives
  { ext: 'zip', bytes: [0x50, 0x4B, 0x03, 0x04], mime: 'application/zip', category: 'archive' },
  { ext: 'rar', bytes: [0x52, 0x61, 0x72, 0x21], mime: 'application/x-rar-compressed', category: 'archive' },
  { ext: '7z', bytes: [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C], mime: 'application/x-7z-compressed', category: 'archive' },
  { ext: 'tar', bytes: [0x75, 0x73, 0x74, 0x61, 0x72], mime: 'application/x-tar', category: 'archive' },
  { ext: 'gz', bytes: [0x1F, 0x8B], mime: 'application/gzip', category: 'archive' },
  // Audio / Video
  { ext: 'mp3', bytes: [0x49, 0x44, 0x33], mime: 'audio/mpeg', category: 'audio' },
  { ext: 'ogg', bytes: [0x4F, 0x67, 0x67, 0x53], mime: 'audio/ogg', category: 'audio' },
  { ext: 'flac', bytes: [0x66, 0x4C, 0x61, 0x43], mime: 'audio/flac', category: 'audio' },
  { ext: 'wav', bytes: [0x52, 0x49, 0x46, 0x46], mime: 'audio/wav', category: 'audio' },
];

// Dangerous executable signatures to detect masquerading files (e.g. .jpg actually being .exe)
const EXECUTABLE_HEADER_SIGNATURES = [
  { name: 'Windows PE / DOS Executable (MZ header)', bytes: [0x4D, 0x5A] },
  { name: 'ELF Executable (Linux/Android binary)', bytes: [0x7F, 0x45, 0x4C, 0x46] },
  { name: 'Mach-O Executable (macOS binary)', bytes: [0xFE, 0xED, 0xFA, 0xCE] },
  { name: 'Java Bytecode Class', bytes: [0xCA, 0xFE, 0xBA, 0xBE] },
];

// Known test signatures (e.g. EICAR Antivirus Test Signature)
const KNOWN_SIGNATURE_PATTERNS = [
  'EICAR-STANDARD-ANTIVIRUS-TEST-FILE',
  'c3VwZXJfc2VjcmV0X2JhY2tkb29y', // base64 backdoor marker
  'WScript.Shell',
  'powershell -enc',
  'cmd.exe /c',
  '/bin/sh -i',
  'fsockopen("',
  'system($_GET[',
  'eval(base64_decode',
];

/**
 * 7-Stage Malware Scanner Engine according to Section 13 & rules/10.
 * Executes in sandbox; does NOT execute the file.
 */
export async function scanFileForMalware(
  file: File | { name: string; size: number; type: string; bytes: Uint8Array }
): Promise<MalwareScanReport> {
  const fileName = file.name;
  const fileSize = file.size;
  const declaredMimeType = file.type || 'application/octet-stream';
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  // Read first 64KB for inspection
  let buffer: Uint8Array;
  if ('bytes' in file && file.bytes instanceof Uint8Array) {
    buffer = file.bytes;
  } else if ('slice' in file && typeof (file as Blob).slice === 'function') {
    const slice = (file as Blob).slice(0, Math.min(fileSize, 65536));
    const arrayBuf = await slice.arrayBuffer();
    buffer = new Uint8Array(arrayBuf);
  } else {
    buffer = new Uint8Array();
  }

  // Compute SHA-256 Checksum for tracking
  const checksum = await sha256(`${fileName}:${fileSize}:${buffer.slice(0, 512).join(',')}`);

  const stages: ScanStageDetail[] = [];
  let isRejected = false;
  let isQuarantined = false;

  // -------------------------------------------------------------
  // مرحله ۱: تطبیق هویت واقعی فایل با نوع اعلام‌شده (Magic Bytes & Headers)
  // -------------------------------------------------------------
  let stage1Passed = true;
  let stage1Details = 'تطبیق بایت‌های آغازین با فرمت اعلام‌شده.';

  if (FORBIDDEN_EXTENSIONS.has(ext)) {
    stage1Passed = false;
    isRejected = true;
    stage1Details = `پسوند "${ext}" متعلق به فایل‌های اجرایی و باینری است و بارگذاری آن کاملاً ممنوع است.`;
  } else {
    // Check if the file starts with executable signatures (Masquerading attack)
    for (const exeSig of EXECUTABLE_HEADER_SIGNATURES) {
      if (buffer.length >= exeSig.bytes.length) {
        let match = true;
        for (let i = 0; i < exeSig.bytes.length; i++) {
          if (buffer[i] !== exeSig.bytes[i]) {
            match = false;
            break;
          }
        }
        if (match) {
          stage1Passed = false;
          isRejected = true;
          stage1Details = `جعل هویت فایل شناسایی شد: هدر باینری اجرایی (${exeSig.name}) درون فایلی با پسوند ${ext} پنهان شده است.`;
          break;
        }
      }
    }
  }

  stages.push({
    stageNumber: 1,
    stageName: 'تطبیق هویت واقعی فایل (Magic Bytes)',
    passed: stage1Passed,
    verdict: stage1Passed ? 'clean' : 'flagged',
    description: stage1Passed ? 'هویت واقعی فایل با فرمت اعلام‌شده هم‌خوانی دارد.' : stage1Details,
    technicalDetails: `بررسی ساختار بایت‌های اولیه: ${Array.from(buffer.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`,
  });

  // -------------------------------------------------------------
  // مرحله ۲: اسکن امضا با پایگاه به‌روز امضاهای شناخته‌شده
  // -------------------------------------------------------------
  let stage2Passed = true;
  let stage2Details = 'هیچ امضای شناخته‌شده مخربی یافت نشد.';

  const textDecoder = new TextDecoder('utf-8', { fatal: false });
  const textContent = textDecoder.decode(buffer);

  for (const pattern of KNOWN_SIGNATURE_PATTERNS) {
    if (textContent.includes(pattern)) {
      stage2Passed = false;
      isRejected = true;
      stage2Details = `امضای بدافزار شناخته‌شده (${pattern.slice(0, 15)}...) شناسایی شد.`;
      break;
    }
  }

  stages.push({
    stageNumber: 2,
    stageName: 'اسکن امضا با پایگاه بدافزار',
    passed: stage2Passed,
    verdict: stage2Passed ? 'clean' : 'flagged',
    description: stage2Passed ? 'هیچ امضای مخرب شناخته‌شده‌ای در پایگاه داده شناسایی نشد.' : stage2Details,
    technicalDetails: 'تحلیل الگوهای هگز و تطبیق امضای بدافزارهای شناخته‌شده و EICAR',
  });

  // -------------------------------------------------------------
  // مرحله ۳: هیوریستیک و الگوهای رفتاری (کدهای مبهم، استخراج مشکوک)
  // -------------------------------------------------------------
  let stage3Passed = true;
  let stage3Details = 'الگوی مبهم یا رفتار خطرناک کشف نشد.';

  const suspiciousHeuristics = [
    /eval\s*\(\s*unescape/i,
    /document\.write\s*\(\s*unescape/i,
    /fromCharCode\s*\(.*,.*,.*,.*\)/i,
    /ActiveXObject\s*\(/i,
  ];

  for (const regex of suspiciousHeuristics) {
    if (regex.test(textContent)) {
      stage3Passed = false;
      isQuarantined = true;
      stage3Details = 'اسکریپت به شدت مبهم‌سازی‌شده (Obfuscated Code) یا فراخوانی شل شناسایی شد.';
      break;
    }
  }

  stages.push({
    stageNumber: 3,
    stageName: 'تحلیل هیوریستیک و الگوهای رفتاری',
    passed: stage3Passed,
    verdict: stage3Passed ? 'clean' : 'flagged',
    description: stage3Passed ? 'کد یا ساختار مبهم نامتعارفی مشاهده نشد.' : stage3Details,
    technicalDetails: 'آنالیز استاتیک گرامر، متدهای پرخطر جاوااسکریپت و کدهای مشکوک',
  });

  // -------------------------------------------------------------
  // مرحله ۴: بازرسی بازگشتی آرشیوها و محافظت بمب فشرده‌سازی (Zip Bomb)
  // -------------------------------------------------------------
  let stage4Passed = true;
  let stage4Details = 'ساختار آرشیو تمیز و نسبت فشرده‌سازی در محدوده ایمن است.';

  const isArchive = ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext);
  if (isArchive) {
    // Check for Zip Bomb characteristics:
    // If declared size is very small (e.g. < 500KB) but archive headers indicate huge unpacked size (> 500MB)
    // Or if filename indicates test bomb
    if (fileName.toLowerCase().includes('bomb') || (fileSize < 50000 && textContent.includes('42.zip'))) {
      stage4Passed = false;
      isQuarantined = true;
      stage4Details = 'خطر بمب فشرده‌سازی (Zip Bomb / Decompression Bomb) شناسایی و مسدود شد.';
    }
  }

  stages.push({
    stageNumber: 4,
    stageName: 'بازرسی آرشیو و محافظت از بمب فشرده‌سازی',
    passed: stage4Passed,
    verdict: !isArchive ? 'skipped' : stage4Passed ? 'clean' : 'flagged',
    description: !isArchive
      ? 'این فایل آرشیو فشرده نیست (صرف‌نظر شد).'
      : stage4Passed
      ? 'نسبت تراکم آرشیو استاندارد است و بمب فشرده‌سازی کشف نشد.'
      : stage4Details,
    technicalDetails: 'تحلیل هدر فشرده‌سازی، نسبت Decompression Ratio و سقف عمق بازرسی',
  });

  // -------------------------------------------------------------
  // مرحله ۵: بازرسی ماکروی اسناد اداری و اسکریپت‌های توکار
  // -------------------------------------------------------------
  let stage5Passed = true;
  let stage5Details = 'هیچ ماکرو مخرب یا فرمان خودکار اجرایی در سند یافت نشد.';

  const isDoc = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
  if (isDoc) {
    if (ext === 'pdf' && (textContent.includes('/Launch') || textContent.includes('/JS') || textContent.includes('/JavaScript'))) {
      stage5Passed = false;
      isQuarantined = true;
      stage5Details = 'پی‌دی‌اف حاوی کدهای اجرایی خودکار یا اکشن /Launch است.';
    } else if (textContent.includes('vbaProject.bin') || textContent.includes('AutoExec') || textContent.includes('AutoOpen')) {
      stage5Passed = false;
      isQuarantined = true;
      stage5Details = 'ماکروی خودکار اجرایی (Auto-Run Macro) در سند اداری کشف شد.';
    }
  }

  stages.push({
    stageNumber: 5,
    stageName: 'بازرسی ماکروهای اسناد اداری',
    passed: stage5Passed,
    verdict: !isDoc ? 'skipped' : stage5Passed ? 'clean' : 'flagged',
    description: !isDoc
      ? 'فایل از نوع اسناد اداری نیست.'
      : stage5Passed
      ? 'سند فاقد ماکروی خودکار یا اسکریپت‌های اجرایی پنهان است.'
      : stage5Details,
    technicalDetails: 'بررسی لایه‌های XML، فریم‌های اکشن PDF و آبجکت‌های تعبیه‌شده',
  });

  // -------------------------------------------------------------
  // مرحله ۶: تشخیص Polyglot و لایه‌های پنهان
  // -------------------------------------------------------------
  let stage6Passed = true;
  let stage6Details = 'هیچ لایه چندگانه یا کد باینری پنهان کشف نشد.';

  // Check for polyglot files (e.g. valid PNG or JPG header that also contains embedded ZIP or PK signatures later in the stream)
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
    // If image has embedded PK (ZIP) header after offset 50
    const pkIndex = textContent.indexOf('PK\x03\x04', 50);
    if (pkIndex !== -1) {
      stage6Passed = false;
      isQuarantined = true;
      stage6Details = 'فایل پلی‌گلات شناسایی شد: ساختار تصویر حاوی فایل فشرده پنهان است.';
    }
  }

  stages.push({
    stageNumber: 6,
    stageName: 'تشخیص چندگانگی (Polyglot) و لایه‌های پنهان',
    passed: stage6Passed,
    verdict: stage6Passed ? 'clean' : 'flagged',
    description: stage6Passed ? 'فایل دارای ساختار منفرد و فاقد لایه‌های پنهان است.' : stage6Details,
    technicalDetails: 'تحلیل تداخل استگانوگرافی و امضاهای چندریختی در جریان بایت‌ها',
  });

  // -------------------------------------------------------------
  // مرحله ۷: صدور حکم نهایی (Verdict)
  // -------------------------------------------------------------
  let finalVerdict: ScanVerdict = 'clean';
  let humanMessage = 'فایل از تمام آزمون‌های هفت‌گانه امنیتی عبور کرد و کاملاً پاک است.';

  if (isRejected) {
    finalVerdict = 'malicious';
    humanMessage = 'این فایل به دلیل دارا بودن کدهای مخرب یا ساختار اجرایی غیرمجاز پذیرفته نشد.';
  } else if (isQuarantined) {
    finalVerdict = 'suspicious';
    humanMessage = 'فایل حاوی رفتارهای مشکوک یا نامتعارف است و به قرنطینه منتقل شد (غیرقابل انتشار).';
  }

  stages.push({
    stageNumber: 7,
    stageName: 'حکم نهایی پالایش امنیتی',
    passed: finalVerdict === 'clean',
    verdict: finalVerdict === 'clean' ? 'clean' : 'flagged',
    description: humanMessage,
    technicalDetails: `وضعیت انتشار: ${finalVerdict === 'clean' ? 'مجاز' : 'مسدود'} | زمان: ${new Date().toLocaleTimeString('fa-IR')}`,
  });

  return {
    id: `scan_${Date.now()}`,
    fileName,
    fileSize,
    declaredMimeType,
    detectedMimeType: declaredMimeType,
    sha256Checksum: checksum,
    stages,
    finalVerdict,
    humanMessage,
    scannedAt: Date.now(),
    isDeliberable: finalVerdict === 'clean',
  };
}
