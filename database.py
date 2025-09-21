#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Модуль управления базой данных для ГСПК 32
Обеспечивает хранение и доступ к документам
"""

import os
import json
import sqlite3
from typing import List, Dict, Any, Optional
from datetime import datetime
import hashlib


class DatabaseManager:
    """Класс для управления базой данных документов"""

    def __init__(self, db_path: str = 'gspk32.db'):
        self.db_path = db_path
        self.init_database()

    def init_database(self):
        """Инициализация базы данных"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Создание таблицы документов
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS documents (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    content TEXT,
                    doc_type TEXT,
                    source TEXT,
                    file_path TEXT,
                    file_hash TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # Создание таблицы индекса для поиска
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS search_index (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    document_id INTEGER,
                    word TEXT,
                    position INTEGER,
                    FOREIGN KEY (document_id) REFERENCES documents (id)
                )
            ''')

            # Создание таблицы метаданных
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS metadata (
                    key TEXT PRIMARY KEY,
                    value TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            conn.commit()
            conn.close()

            print(f"База данных инициализирована: {self.db_path}")

        except Exception as e:
            print(f"Ошибка инициализации базы данных: {e}")

    def add_document(self, title: str, content: str, doc_type: str,
                    source: str = '', file_path: str = '') -> int:
        """
        Добавление документа в базу данных

        Args:
            title: Название документа
            content: Содержимое документа
            doc_type: Тип документа
            source: Источник документа
            file_path: Путь к файлу

        Returns:
            ID добавленного документа
        """
        try:
            # Вычисление хэша содержимого
            file_hash = hashlib.md5(content.encode('utf-8')).hexdigest()

            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute('''
                INSERT INTO documents (title, content, doc_type, source, file_path, file_hash)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (title, content, doc_type, source, file_path, file_hash))

            doc_id = cursor.lastrowid

            # Обновление индекса поиска
            self.update_search_index(doc_id, content)

            # Обновление метаданных
            self.update_metadata('last_document_id', str(doc_id))

            conn.commit()
            conn.close()

            print(f"Документ добавлен: {title} (ID: {doc_id})")
            return doc_id

        except Exception as e:
            print(f"Ошибка добавления документа: {e}")
            return -1

    def update_search_index(self, doc_id: int, content: str):
        """Обновление индекса поиска для документа"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Удаление старого индекса
            cursor.execute('DELETE FROM search_index WHERE document_id = ?', (doc_id,))

            # Разбор текста на слова
            words = self.tokenize_text(content)

            # Добавление новых записей индекса
            for position, word in enumerate(words):
                cursor.execute('''
                    INSERT INTO search_index (document_id, word, position)
                    VALUES (?, ?, ?)
                ''', (doc_id, word.lower(), position))

            conn.commit()
            conn.close()

        except Exception as e:
            print(f"Ошибка обновления индекса поиска: {e}")

    def tokenize_text(self, text: str) -> List[str]:
        """Разбор текста на слова для индексации"""
        # Удаление пунктуации и разбор на слова
        words = re.findall(r'\b\w+\b', text)
        return words

    def search_documents(self, query: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Поиск документов по запросу

        Args:
            query: Поисковый запрос
            limit: Максимальное количество результатов

        Returns:
            Список найденных документов
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Разбор запроса на слова
            query_words = self.tokenize_text(query)

            if not query_words:
                return []

            # Поиск документов, содержащих все слова запроса
            placeholders = ','.join(['?'] * len(query_words))
            cursor.execute(f'''
                SELECT DISTINCT d.id, d.title, d.content, d.doc_type, d.source
                FROM documents d
                JOIN search_index si ON d.id = si.document_id
                WHERE si.word IN ({placeholders})
                GROUP BY d.id
                HAVING COUNT(DISTINCT si.word) = ?
                ORDER BY d.updated_at DESC
                LIMIT ?
            ''', query_words + [len(query_words), limit])

            results = []
            for row in cursor.fetchall():
                results.append({
                    'id': row[0],
                    'title': row[1],
                    'content': row[2],
                    'type': row[3],
                    'source': row[4]
                })

            conn.close()
            return results

        except Exception as e:
            print(f"Ошибка поиска: {e}")
            return []

    def get_document(self, doc_id: int) -> Optional[Dict[str, Any]]:
        """Получение документа по ID"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute('''
                SELECT id, title, content, doc_type, source, file_path, created_at, updated_at
                FROM documents WHERE id = ?
            ''', (doc_id,))

            row = cursor.fetchone()
            conn.close()

            if row:
                return {
                    'id': row[0],
                    'title': row[1],
                    'content': row[2],
                    'type': row[3],
                    'source': row[4],
                    'file_path': row[5],
                    'created_at': row[6],
                    'updated_at': row[7]
                }

            return None

        except Exception as e:
            print(f"Ошибка получения документа: {e}")
            return None

    def get_all_documents(self) -> List[Dict[str, Any]]:
        """Получение всех документов"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute('''
                SELECT id, title, doc_type, source, created_at, updated_at
                FROM documents
                ORDER BY updated_at DESC
            ''')

            results = []
            for row in cursor.fetchall():
                results.append({
                    'id': row[0],
                    'title': row[1],
                    'type': row[2],
                    'source': row[3],
                    'created_at': row[4],
                    'updated_at': row[5]
                })

            conn.close()
            return results

        except Exception as e:
            print(f"Ошибка получения документов: {e}")
            return []

    def update_document(self, doc_id: int, title: str = None,
                       content: str = None) -> bool:
        """Обновление документа"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            updates = []
            params = []

            if title is not None:
                updates.append("title = ?")
                params.append(title)

            if content is not None:
                updates.append("content = ?")
                params.append(content)
                updates.append("updated_at = CURRENT_TIMESTAMP")

            if updates:
                updates.append("updated_at = CURRENT_TIMESTAMP")
                params.append(doc_id)

                cursor.execute(f'''
                    UPDATE documents
                    SET {', '.join(updates)}
                    WHERE id = ?
                ''', params)

                # Обновление индекса поиска если изменилось содержимое
                if content is not None:
                    self.update_search_index(doc_id, content)

                conn.commit()
                conn.close()
                return True

            return False

        except Exception as e:
            print(f"Ошибка обновления документа: {e}")
            return False

    def delete_document(self, doc_id: int) -> bool:
        """Удаление документа"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute('DELETE FROM documents WHERE id = ?', (doc_id,))
            cursor.execute('DELETE FROM search_index WHERE document_id = ?', (doc_id,))

            conn.commit()
            conn.close()

            print(f"Документ удален: {doc_id}")
            return True

        except Exception as e:
            print(f"Ошибка удаления документа: {e}")
            return False

    def update_metadata(self, key: str, value: str):
        """Обновление метаданных"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute('''
                INSERT OR REPLACE INTO metadata (key, value, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
            ''', (key, value))

            conn.commit()
            conn.close()

        except Exception as e:
            print(f"Ошибка обновления метаданных: {e}")

    def get_metadata(self, key: str) -> Optional[str]:
        """Получение метаданных"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute('SELECT value FROM metadata WHERE key = ?', (key,))
            row = cursor.fetchone()
            conn.close()

            return row[0] if row else None

        except Exception as e:
            print(f"Ошибка получения метаданных: {e}")
            return None

    def get_database_stats(self) -> Dict[str, Any]:
        """Получение статистики базы данных"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Общая статистика
            cursor.execute('SELECT COUNT(*) FROM documents')
            total_docs = cursor.fetchone()[0]

            cursor.execute('SELECT COUNT(*) FROM search_index')
            total_index = cursor.fetchone()[0]

            # Статистика по типам
            cursor.execute('''
                SELECT doc_type, COUNT(*) as count
                FROM documents
                GROUP BY doc_type
            ''')
            type_stats = {row[0]: row[1] for row in cursor.fetchall()}

            conn.close()

            return {
                'total_documents': total_docs,
                'total_index_entries': total_index,
                'documents_by_type': type_stats
            }

        except Exception as e:
            print(f"Ошибка получения статистики: {e}")
            return {}
