#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Скрипт запуска ГСПК 32 с различными опциями
"""

import os
import sys
import argparse
from pathlib import Path


def setup_environment():
    """Настройка окружения"""
    print("🔧 Настройка окружения ГСПК 32...")

    # Проверка Python версии
    if sys.version_info < (3, 8):
        print("❌ Требуется Python 3.8 или выше")
        sys.exit(1)

    print(f"✅ Python {sys.version.split()[0]}")

    # Проверка наличия необходимых файлов
    required_files = ['main.py', 'main.kv', 'database.py', 'search.py']
    for file in required_files:
        if not os.path.exists(file):
            print(f"❌ Отсутствует файл: {file}")
            sys.exit(1)

    print("✅ Все необходимые файлы найдены")


def run_app():
    """Запуск основного приложения"""
    print("🚀 Запуск ГСПК 32...")
    try:
        from main import GSPK32App
        GSPK32App().run()
    except ImportError as e:
        print(f"❌ Ошибка импорта: {e}")
        print("💡 Установите зависимости: pip install -r requirements.txt")
    except Exception as e:
        print(f"❌ Ошибка запуска: {e}")


def run_tests():
    """Запуск тестирования"""
    print("🧪 Запуск тестирования...")
    try:
        os.system("python test_gspk32.py")
    except Exception as e:
        print(f"❌ Ошибка тестирования: {e}")


def run_import():
    """Запуск импорта данных"""
    print("📥 Запуск импорта данных...")
    try:
        os.system("python import_participants_fixed.py")
    except Exception as e:
        print(f"❌ Ошибка импорта: {e}")


def create_sample_data():
    """Создание примерных данных"""
    print("📝 Создание примерных данных...")

    # Создание примера JSON файла
    sample_json = {
        "id": "SAMPLE001",
        "name": "Пример Участника",
        "address": "г. Примерный, ул. Тестовая, д. 1",
        "phone": "+7 (123) 456-78-90",
        "additional": "Пример данных",
        "details": "Это пример участника для тестирования системы"
    }

    try:
        with open('sample_participant.json', 'w', encoding='utf-8') as f:
            import json
            json.dump(sample_json, f, ensure_ascii=False, indent=2)
        print("✅ Создан sample_participant.json")
    except Exception as e:
        print(f"❌ Ошибка создания примера: {e}")


def show_help():
    """Отображение справки"""
    help_text = """
ГСПК 32 - Система управления документами

Команды:
  app         - Запуск основного приложения (по умолчанию)
  test        - Запуск тестирования
  import      - Импорт данных участников
  setup       - Настройка окружения
  sample      - Создание примерных данных
  help        - Показать эту справку

Примеры использования:
  python run_gspk32.py app
  python run_gspk32.py test
  python run_gspk32.py import
"""
    print(help_text)


def main():
    """Главная функция"""
    parser = argparse.ArgumentParser(
        description='ГСПК 32 - Система управления документами',
        add_help=False
    )

    parser.add_argument(
        'command',
        nargs='?',
        default='app',
        choices=['app', 'test', 'import', 'setup', 'sample', 'help'],
        help='Команда для выполнения'
    )

    parser.add_argument(
        '--debug',
        action='store_true',
        help='Включить режим отладки'
    )

    args = parser.parse_args()

    # Включение отладки если запрошено
    if args.debug:
        os.environ['KIVY_LOG_LEVEL'] = 'debug'
        print("🐛 Режим отладки включен")

    # Выполнение команд
    if args.command == 'app':
        setup_environment()
        run_app()
    elif args.command == 'test':
        run_tests()
    elif args.command == 'import':
        run_import()
    elif args.command == 'setup':
        setup_environment()
    elif args.command == 'sample':
        create_sample_data()
    elif args.command == 'help':
        show_help()
    else:
        print(f"❌ Неизвестная команда: {args.command}")
        show_help()


if __name__ == '__main__':
    main()
