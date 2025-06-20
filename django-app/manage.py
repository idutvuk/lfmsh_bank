#!/usr/bin/env python
import os
import sys
from loguru import logger

logger.remove()
logger.add(sys.stderr, colorize=True, format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>")

if __name__ == '__main__':
  os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')

  from django.core.management import execute_from_command_line

  execute_from_command_line(sys.argv)
