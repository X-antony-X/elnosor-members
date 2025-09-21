#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Модуль поиска для ГСПК 32
Предоставляет функциональность поиска по документам
"""

import os
import json
import re
from typing import List, Dict, Any
from pathlib import Path


class SearchModule:
    """Класс для поиска документов ГСПК"""

    def __init__(self):
        self.documents = []
        self.load_documents()

    def load_documents(self):
        """Загрузка документов из различных источников"""
        try:
            # Загрузка из JSON файлов
            self.load_json_documents()

            # Загрузка из текстовых файлов
            self.load_text_documents()

            # Загрузка из PDF (если есть соответствующие библиотеки)
            # self.load_pdf_documents()

            print(f"Загружено документов: {len(self.documents)}")

        except Exception as e:
            print(f"Ошибка загрузки документов: {e}")

    def load_json_documents(self):
        """Загрузка документов из JSON файлов"""
        json_files = [
            'box.json',
            'participants.json'
        ]

        for json_file in json_files:
            if os.path.exists(json_file):
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)

                    if isinstance(data, list):
                        for item in data:
                            self.documents.append({
                                'title': item.get('name', 'Без названия'),
                                'type': 'JSON',
                                'content': json.dumps(item, ensure_ascii=False),
                                'source': json_file
                            })
                    elif isinstance(data, dict):
                        self.documents.append({
                            'title': data.get('name', 'Без названия'),
                            'type': 'JSON',
                            'content': json.dumps(data, ensure_ascii=False),
                            'source': json_file
                        })

                except Exception as e:
                    print(f"Ошибка чтения {json_file}: {e}")

    def load_text_documents(self):
        """Загрузка документов из текстовых файлов"""
        # Поиск всех .txt файлов в текущей директории
        for file_path in Path('.').glob('*.txt'):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                self.documents.append({
                    'title': file_path.stem,
                    'type': 'TXT',
                    'content': content,
                    'source': str(file_path)
                })

            except Exception as e:
                print(f"Ошибка чтения {file_path}: {e}")

    def search(self, query: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Поиск документов по запросу

        Args:
            query: Поисковый запрос
            limit: Максимальное количество результатов

        Returns:
            Список найденных документов
        """
        if not query.strip():
            return []

        results = []
        query_lower = query.lower()

        for doc in self.documents:
            # Поиск в заголовке
            if query_lower in doc['title'].lower():
                results.append({
                    **doc,
                    'match_type': 'title',
                    'relevance': 10
                })
                continue

            # Поиск в содержимом
            content_lower = doc['content'].lower()
            if query_lower in content_lower:
                # Подсчет релевантности
                relevance = content_lower.count(query_lower)

                results.append({
                    **doc,
                    'match_type': 'content',
                    'relevance': relevance
                })

        # Сортировка по релевантности
        results.sort(key=lambda x: x['relevance'], reverse=True)

        # Ограничение количества результатов
        return results[:limit]

    def search_by_type(self, doc_type: str, query: str = "") -> List[Dict[str, Any]]:
        """
        Поиск документов по типу

        Args:
            doc_type: Тип документа (JSON, TXT, PDF)
            query: Дополнительный поисковый запрос

        Returns:
            Список документов указанного типа
        """
        filtered_docs = [doc for doc in self.documents if doc['type'] == doc_type]

        if query:
            return self.search(query, limit=len(filtered_docs))
        else:
            return filtered_docs

    def get_document_by_title(self, title: str) -> Dict[str, Any]:
        """
        Получение документа по точному названию

        Args:
            title: Название документа

        Returns:
            Документ или None
        """
        for doc in self.documents:
            if doc['title'] == title:
                return doc
        return None

    def get_statistics(self) -> Dict[str, Any]:
        """
        Получение статистики по документам

        Returns:
            Словарь со статистикой
        """
        stats = {
            'total': len(self.documents),
            'by_type': {}
        }

        for doc in self.documents:
            doc_type = doc['type']
            if doc_type not in stats['by_type']:
                stats['by_type'][doc_type] = 0
            stats['by_type'][doc_type] += 1

        return stats

    def export_results(self, results: List[Dict[str, Any]], filename: str):
        """
        Экспорт результатов поиска в файл

        Args:
            results: Результаты поиска
            filename: Имя файла для экспорта
        """
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(results, f, ensure_ascii=False, indent=2)
            print(f"Результаты экспортированы в {filename}")
        except Exception as e:
            print(f"Ошибка экспорта: {e}")


# Функции для удобства использования
def search_documents(query: str) -> List[Dict[str, Any]]:
    """Удобная функция для поиска документов"""
    search_module = SearchModule()
    return search_module.search(query)

def get_document_stats() -> Dict[str, Any]:
    """Получение статистики по документам"""
    search_module = SearchModule()
    return search_module.get_statistics()
