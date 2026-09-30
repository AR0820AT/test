"""
把思源宋体可变字体（CFF2 VF，19MB）做成 iOS Safari 能稳定加载的静态子集：

1) 实例化：wght 固定为 500 —— 静态 CFF，任何浏览器都认
   （iOS Safari 对超大字体文件与部分可变字体支持不稳，Google Fonts 给移动端
    的也是这种静态子集形态）
2) 子集化：只保留常用字符（GB2312 全部汉字 + 拉丁/数字/常用标点/全角符号）

用法：C:/Users/17497/.workbuddy/binaries/python/versions/3.14.3/python.exe scripts/build-zh-font.py
源字体放在 scripts/fonts-src/（不进 public，不会部署到线上）
"""
import os
import subprocess
import sys

PY = sys.executable
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, 'scripts', 'fonts-src')
SRC = os.path.join(SRC_DIR, 'SourceHanSerifSC-VF.otf.woff2')
INSTANCED = os.path.join(SRC_DIR, '_instanced.otf')
FONTS = os.path.join(ROOT, 'public', 'fonts')
CHARS = os.path.join(SRC_DIR, '_chars.txt')
OUT = os.path.join(FONTS, 'SourceHanSerifSC-500.woff2')


def build_unicodes():
    """常用字：GB2312 全部汉字 + 拉丁/数字/常用标点/全角符号"""
    chars = set()
    for hi in range(0xB0, 0xF8):
        for lo in range(0xA1, 0xFF):
            try:
                chars.add(bytes([hi, lo]).decode('gb2312'))
            except UnicodeDecodeError:
                pass
    for start, end in [
        (0x20, 0x7F), (0xA0, 0x100), (0x2000, 0x2070),
        (0x2100, 0x2150), (0x3000, 0x3040), (0xFF00, 0xFFF0),
    ]:
        chars.update(chr(code) for code in range(start, end))
    return ''.join(sorted(chars))


def run(args):
    subprocess.run([PY] + args, check=True)


def main():
    if not os.path.exists(SRC):
        raise SystemExit('找不到源字体：' + SRC)

    text = build_unicodes()
    print('字符集：%d 个' % len(text))
    with open(CHARS, 'w', encoding='utf-8') as handle:
        handle.write(text)

    # 1) 可变字体 → 固定 500 字重的静态 OTF
    run(['-m', 'fontTools.varLib.instancer', SRC, 'wght=500', '--output', INSTANCED])
    # 2) 子集化并压成 woff2
    run([
        '-m', 'fontTools.subset', INSTANCED,
        '--text-file=' + CHARS,
        '--flavor=woff2',
        '--layout-features=*',
        '--no-hinting',
        '--output-file=' + OUT,
    ])
    os.remove(CHARS)
    os.remove(INSTANCED)
    print('生成 %s：%.2f MB' % (OUT, os.path.getsize(OUT) / 1024 / 1024))


if __name__ == '__main__':
    main()
