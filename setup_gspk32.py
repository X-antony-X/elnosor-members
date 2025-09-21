#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Скрипт полной установки и настройки ГСПК 32
"""

import os
import sys
import subprocess
import platform


def check_python_version():
    """Проверка версии Python"""
    print("🔍 Проверка версии Python...")

    if sys.version_info < (3, 8):
        print("❌ Требуется Python 3.8 или выше")
        print(f"   Установленная версия: {sys.version.split()[0]}")
        return False

    print(f"✅ Python {sys.version.split()[0]}")
    return True


def install_dependencies():
    """Установка зависимостей"""
    print("\n📦 Установка зависимостей...")

    try:
        # Установка основных зависимостей
        subprocess.check_call([
            sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'
        ])

        print("✅ Зависимости установлены")

        # Проверка установки Kivy
        try:
            import kivy
            print(f"✅ Kivy {kivy.__version__} установлен")
        except ImportError:
            print("⚠️ Kivy не установлен, установка...")
            subprocess.check_call([
                sys.executable, '-m', 'pip', 'install', 'kivy==2.2.1'
            ])
            print("✅ Kivy установлен")

    except subprocess.CalledProcessError as e:
        print(f"❌ Ошибка установки зависимостей: {e}")
        return False

    return True


def setup_database():
    """Настройка базы данных"""
    print("\n🗄️ Настройка базы данных...")

    try:
        from database import DatabaseManager

        db = DatabaseManager()
        stats = db.get_database_stats()

        print("✅ База данных настроена")
        print(f"   Документов в БД: {stats.get('total_documents', 0)}")

    except Exception as e:
        print(f"❌ Ошибка настройки базы данных: {e}")
        return False

    return True


def import_sample_data():
    """Импорт примерных данных"""
    print("\n📥 Импорт примерных данных...")

    if os.path.exists('participants.json'):
        try:
            os.system(f"{sys.executable} import_participants_fixed.py")
            print("✅ Примерные данные импортированы")
        except Exception as e:
            print(f"❌ Ошибка импорта данных: {e}")
    else:
        print("⚠️ Файл participants.json не найден, пропуск импорта")


def run_tests():
    """Запуск тестирования"""
    print("\n🧪 Запуск тестирования...")

    try:
        os.system(f"{sys.executable} test_gspk32.py")
    except Exception as e:
        print(f"❌ Ошибка тестирования: {e}")


def create_desktop_shortcut():
    """Создание ярлыка на рабочем столе"""
    print("\n🖥️ Создание ярлыка на рабочем столе...")

    try:
        system = platform.system()

        if system == "Windows":
            # Создание ярлыка для Windows
            desktop = os.path.join(os.path.expanduser("~"), "Desktop")
            shortcut_path = os.path.join(desktop, "ГСПК 32.lnk")

            # Создание VBS скрипта для создания ярлыка
            vbs_content = f'''
Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = "{shortcut_path}"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "{sys.executable}"
oLink.Arguments = "run_gspk32.py app"
oLink.Description = "ГСПК 32 - Система управления документами"
oLink.WorkingDirectory = "{os.getcwd()}"
oLink.IconLocation = "{sys.executable}, 0"
oLink.Save
            '''

            vbs_file = os.path.join(os.getcwd(), "create_shortcut.vbs")
            with open(vbs_file, 'w') as f:
                f.write(vbs_content)

            os.system(f'cscript "{vbs_file}"')
            os.remove(vbs_file)

            print(f"✅ Ярлык создан: {shortcut_path}")

        elif system == "Linux":
            # Создание .desktop файла для Linux
            desktop_file = os.path.expanduser("~/Desktop/gspk32.desktop")

            desktop_content = f'''[Desktop Entry]
Version=1.0
Name=ГСПК 32
Comment=Система управления документами
Exec={sys.executable} {os.path.join(os.getcwd(), "run_gspk32.py")} app
Icon={sys.executable}
Terminal=true
Type=Application
Categories=Office;Database;
'''

            with open(desktop_file, 'w') as f:
                f.write(desktop_content)

            os.chmod(desktop_file, 0o755)
            print(f"✅ Ярлык создан: {desktop_file}")

        else:
            print("⚠️ Автоматическое создание ярлыка не поддерживается для этой ОС")

    except Exception as e:
        print(f"❌ Ошибка создания ярлыка: {e}")


def show_success_message():
    """Отображение сообщения об успешной установке"""
    print("\n" + "=" * 60)
    print("🎉 ГСПК 32 успешно установлен!")
    print("=" * 60)
    print("\n📁 Расположение файлов:")
    print(f"   {os.getcwd()}")
    print("\n🚀 Запуск приложения:")
    print("   python run_gspk32.py app")
    print("   или python main.py")
    print("\n🧪 Тестирование:")
    print("   python run_gspk32.py test")
    print("\n📥 Импорт данных:")
    print("   python run_gspk32.py import")
    print("\n📖 Документация:")
    print("   См. README_GSPK32.md")
    print("\n" + "=" * 60)


def main():
    """Главная функция установки"""
    print("🚀 Установка ГСПК 32 - Система управления документами")
    print("=" * 60)

    # Проверка версии Python
    if not check_python_version():
        return

    # Установка зависимостей
    if not install_dependencies():
        return

    # Настройка базы данных
    if not setup_database():
        return

    # Импорт примерных данных
    import_sample_data()

    # Запуск тестирования
    run_tests()

    # Создание ярлыка
    create_desktop_shortcut()

    # Показать сообщение об успехе
    show_success_message()


if __name__ == '__main__':
    main()
