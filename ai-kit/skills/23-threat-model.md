---
name: soozan-threat-model
description: مدل تهدید هر فاز با STRIDE و سناریوهای سوءاستفاده.
---
برای هر جریان (آپلود، صدور کد، دریافت، OTP، نشست، مدیر) بپرس: Spoofing / Tampering / Repudiation / InfoDisclosure / DoS / ElevationOfPrivilege.
سناریوهای سوءاستفاده‌ی دائمی: brute-force کد اشتراک، enumeration کدها، replay کد مصرف‌شده، آپلود بدافزار در آرشیو، scraper صفحه‌ی دریافت، fingerprint کردن گیرنده، نشت کد در کانال اشتراک‌گذاری.
هر تهدید ⇒ کاهش مشخص + ثبت در templates/34 و memory/43.