#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Скрипт импорта данных участников ГСПК в базу данных
"""

import json
import os
from database import DatabaseManager


def import_participants_from_json(json_file: str):
    """
    Импорт данных участников из JSON файла

    Args:
        json_file: Путь к JSON файлу с данными участников
    """
    if not os.path.exists(json_file):
        print(f"Файл {json_file} не найден")
        return

    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        db = DatabaseManager()

        if isinstance(data, list):
            # Если данные представлены как список
            for participant in data:
                import_participant(db, participant)
        elif isinstance(data, dict):
            # Если данные представлены как словарь
            import_participant(db, data)

        print("Импорт завершен успешно!")

    except Exception as e:
        print(f"Ошибка импорта: {e}")


def import_participant(db: DatabaseManager, participant: dict):
    """
    Импорт одного участника

    Args:
        db: Экземпляр DatabaseManager
        participant: Данные участника
    """
    try:
        # Извлечение данных участника
        participant_id = participant.get('id', '')
        name = participant.get('name', participant.get('Фамилия', '') + ' ' +
                              participant.get('Имя', '')).strip()
        address = participant.get('address', participant.get('Адрес', ''))
        phone = participant.get('phone', participant.get('Телефон', ''))
        additional = participant.get('additional', participant.get('Дополнительно', ''))
        details = participant.get('details', participant.get('Подробности', ''))

        # Формирование содержимого документа
        content = f"""
Участник ГСПК №{participant_id}

ФИО: {name}
Адрес: {address}
Телефон: {phone}
Дополнительно: {additional}
Подробности: {details}
""".strip()

        # Добавление в базу данных
        doc_id = db.add_document(
            title=name or f"Участник №{participant_id}",
            content=content,
            doc_type="PARTICIPANT",
            source=json_file
        )

        if doc_id > 0:
            print(f"✓ Импортирован участник: {name}")
        else:
            print(f"✗ Ошибка импорта участника: {name}")

    except Exception as e:
        print(f"Ошибка импорта участника: {e}")


def import_from_text_file(text_file: str):
    """
    Импорт данных из текстового файла

    Args:
        text_file: Путь к текстовому файлу
    """
    if not os.path.exists(text_file):
        print(f"Файл {text_file} не найден")
        return

    try:
        with open(text_file, 'r', encoding='utf-8') as f:
            content = f.read()

        db = DatabaseManager()

        # Разбор текста на участников (простая логика)
        lines = content.split('\n')
        current_participant = {}
        participants = []

        for line in lines:
            line = line.strip()
            if not line:
                continue

            if line.startswith('Участник') or line.startswith('№'):
                # Сохранение предыдущего участника
                if current_participant:
                    participants.append(current_participant)
                current_participant = {'name': line}
            elif ':' in line:
                key, value = line.split(':', 1)
                current_participant[key.strip()] = value.strip()

        # Сохранение последнего участника
        if current_participant:
            participants.append(current_participant)

        # Импорт участников
        for participant in participants:
            import_participant(db, participant)

        print("Импорт из текстового файла завершен!")

    except Exception as e:
        print(f"Ошибка импорта из текстового файла: {e}")


def main():
    """Главная функция"""
    print("Импорт данных участников ГСПК")
    print("=" * 40)

    # Поиск файлов данных
    json_files = ['participants.json', 'box.json', 'data.json']
    text_files = ['participants.txt', 'data.txt']

    # Импорт из JSON файлов
    for json_file in json_files:
        if os.path.exists(json_file):
            print(f"\nИмпорт из {json_file}...")
            import_participants_from_json(json_file)

    # Импорт из текстовых файлов
    for text_file in text_files:
        if os.path.exists(text_file):
            print(f"\nИмпорт из {text_file}...")
            import_from_text_file(text_file)

    # Отображение статистики
    db = DatabaseManager()
    stats = db.get_database_stats()
    print("\nСтатистика базы данных:")
    print(f"Всего документов: {stats.get('total_documents', 0)}")
    print(f"Записей в индексе: {stats.get('total_index_entries', 0)}")
    print(f"Типы документов: {stats.get('documents_by_type', {})}")


if __name__ == '__main__':
    main()
