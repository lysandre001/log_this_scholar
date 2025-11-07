#!/usr/bin/env python3
"""
生成Chrome扩展所需的PNG图标
需要安装: pip install cairosvg pillow
"""

import os
import sys

try:
    import cairosvg
except ImportError:
    print("错误: 需要安装 cairosvg")
    print("运行: pip install cairosvg")
    sys.exit(1)

def generate_icons():
    svg_path = os.path.join(os.path.dirname(__file__), 'icon.svg')
    sizes = [16, 48, 128]
    
    if not os.path.exists(svg_path):
        print(f"错误: 找不到 {svg_path}")
        return False
    
    for size in sizes:
        png_path = os.path.join(os.path.dirname(__file__), f'icon{size}.png')
        try:
            cairosvg.svg2png(
                url=svg_path,
                write_to=png_path,
                output_width=size,
                output_height=size
            )
            print(f"✓ 生成 {png_path} ({size}x{size})")
        except Exception as e:
            print(f"✗ 生成 {png_path} 失败: {e}")
            return False
    
    return True

if __name__ == '__main__':
    print("正在生成图标...")
    if generate_icons():
        print("\n所有图标生成完成！")
    else:
        print("\n图标生成失败，请检查错误信息。")
        sys.exit(1)

