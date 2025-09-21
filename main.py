#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
ГСПК 32 - Главное приложение
Система поиска и управления документами ГСПК
"""

import os
import sys
from kivy.app import App
from kivy.lang import Builder
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.screenmanager import ScreenManager, Screen
from kivy.core.window import Window
from kivy.utils import get_color_from_hex

# Импорт модулей приложения
from search import SearchModule
from database import DatabaseManager

# Установка размера окна
Window.size = (1200, 800)

# Цветовая схема ГСПК
GSPK_COLORS = {
    'primary': get_color_from_hex('#2E7D32'),      # Зеленый
    'secondary': get_color_from_hex('#4CAF50'),    # Светло-зеленый
    'accent': get_color_from_hex('#81C784'),       # Акцент
    'background': get_color_from_hex('#F1F8E9'),   # Фон
    'text': get_color_from_hex('#212121'),         # Текст
    'text_secondary': get_color_from_hex('#757575') # Второстепенный текст
}


class MainScreen(Screen):
    """Главный экран приложения"""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.search_module = SearchModule()
        self.db_manager = DatabaseManager()

    def on_enter(self):
        """Вызывается при переходе на экран"""
        self.update_stats()

    def update_stats(self):
        """Обновление статистики"""
        try:
            total_docs = len(self.db_manager.get_all_documents())
            self.ids.total_docs_label.text = f"Всего документов: {total_docs}"
        except Exception as e:
            print(f"Ошибка обновления статистики: {e}")
            self.ids.total_docs_label.text = "Всего документов: 0"

    def open_search(self):
        """Переход к поиску"""
        self.manager.current = 'search'

    def open_settings(self):
        """Открытие настроек"""
        # TODO: Реализовать экран настроек
        pass

    def open_about(self):
        """Открытие информации о программе"""
        # TODO: Реализовать экран "О программе"
        pass


class SearchScreen(Screen):
    """Экран поиска"""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.search_module = SearchModule()
        self.db_manager = DatabaseManager()

    def perform_search(self):
        """Выполнение поиска"""
        query = self.ids.search_input.text.strip()
        if not query:
            return

        try:
            results = self.search_module.search(query)
            self.display_results(results)
        except Exception as e:
            print(f"Ошибка поиска: {e}")
            self.ids.search_results.text = f"Ошибка поиска: {str(e)}"

    def display_results(self, results):
        """Отображение результатов поиска"""
        if not results:
            self.ids.search_results.text = "Результаты не найдены"
            return

        result_text = f"Найдено результатов: {len(results)}\n\n"
        for i, result in enumerate(results[:10], 1):  # Показываем первые 10 результатов
            result_text += f"{i}. {result.get('title', 'Без названия')}\n"
            result_text += f"   Тип: {result.get('type', 'Неизвестно')}\n"
            if 'description' in result:
                result_text += f"   Описание: {result['description'][:100]}...\n"
            result_text += "\n"

        self.ids.search_results.text = result_text

    def go_back(self):
        """Возврат к главному экрану"""
        self.manager.current = 'main'


class GSPK32App(App):
    """Главное приложение ГСПК 32"""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.title = 'ГСПК 32 - Система управления документами'

    def build(self):
        """Построение интерфейса приложения"""
        # Загрузка KV файла
        Builder.load_file('main.kv')

        # Создание менеджера экранов
        sm = ScreenManager()

        # Добавление экранов
        sm.add_widget(MainScreen(name='main'))
        sm.add_widget(SearchScreen(name='search'))

        return sm

    def on_start(self):
        """Вызывается при запуске приложения"""
        print("ГСПК 32 запущен")
        print(f"Рабочая директория: {os.getcwd()}")

    def on_stop(self):
        """Вызывается при закрытии приложения"""
        print("ГСПК 32 закрыт")


if __name__ == '__main__':
    try:
        GSPK32App().run()
    except Exception as e:
        print(f"Ошибка запуска приложения: {e}")
        sys.exit(1)
