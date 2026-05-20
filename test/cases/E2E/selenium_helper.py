import os
import shutil
from selenium import webdriver
from selenium.webdriver.chrome.service import Service


def find_local_chromedriver():
    # Check env var
    env = os.getenv('CHROMEDRIVER_PATH')
    if env and os.path.exists(env):
        return env

    candidate_paths = [
        os.path.expandvars(r'%LOCALAPPDATA%\.cache\selenium\chromedriver\win64\148.0.7778.178\chromedriver.exe'),
        os.path.expandvars(r'%LOCALAPPDATA%\.cache\selenium\chromedriver\win64\147.0.7727.117\chromedriver.exe'),
        os.path.expandvars(r'%USERPROFILE%\.wdm\drivers\chromedriver\win64\147.0.7727.117\chromedriver-win32\chromedriver.exe'),
        os.path.expandvars(r'%LOCALAPPDATA%\.cache\selenium\chromedriver\win64\147.0.7727.57\chromedriver.exe'),
    ]
    for candidate in candidate_paths:
        if os.path.exists(candidate):
            return candidate

    # Search upward from this file for chromedriver.exe
    p = os.path.dirname(__file__)
    for _ in range(6):
        candidate = os.path.join(p, 'chromedriver.exe')
        if os.path.exists(candidate):
            return candidate
        p = os.path.abspath(os.path.join(p, '..'))

    # Check PATH
    which_path = shutil.which('chromedriver') or shutil.which('chromedriver.exe')
    if which_path:
        return which_path

    return None


def create_driver(chrome_options):
    """Create a Chrome WebDriver, preferring a local chromedriver executable
    to avoid Selenium Manager network delays. Returns a webdriver.Chrome instance.
    """
    path = find_local_chromedriver()
    if path:
        print(f"Using chromedriver from: {path}", flush=True)
        service = Service(executable_path=path)
        return webdriver.Chrome(service=service, options=chrome_options)

    # Fallback to default (Selenium Manager) if no local driver found
    print("No local chromedriver found; falling back to Selenium Manager (may delay)", flush=True)
    return webdriver.Chrome(options=chrome_options)
