from httpcore import TimeoutException
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from time import sleep
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
import math


# Load environment variables
load_dotenv(dotenv_path=".env.local")

# Base URL for RateMyProfessor
BASE_URL = "https://www.ratemyprofessors.com"

# Setup Chrome options
chrome_options = Options()
chrome_options.add_argument("--headless")  # Ensure GUI is off
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")
chrome_options.add_argument("--disable-extensions")
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--disable-popup-blocking")
chrome_options.add_argument("--disable-images")

# Disable SSL warnings and CORS errors
caps = DesiredCapabilities().CHROME
caps["pageLoadStrategy"] = "normal"  # Wait for full page load
caps["acceptInsecureCerts"] = True
caps["goog:loggingPrefs"] = {"performance": "ALL"}  # Enable performance logging

# Set path to chromedriver as per your configuration
webdriver_service = Service('C:/Users/alexfarouz/Downloads/chromedriver-win64/chromedriver-win64/chromedriver.exe')

# Choose Chrome Browser
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)

def get_school_id(school_name):
    """
    Searches for a school by name on RateMyProfessor and returns the most relevant school's ID.
    """
    search_url = f"{BASE_URL}/search/schools?q={school_name}"
    response = requests.get(search_url)
    
    if response.status_code != 200:
        raise ValueError(f"Failed to fetch the page, status code: {response.status_code}")
    
    soup = BeautifulSoup(response.text, 'html.parser')

    school_links = soup.find_all("a", class_="SchoolCard__StyledSchoolCard-sc-130cnkk-0")
    
    if not school_links:
        raise ValueError(f"Could not find school with name: {school_name}")
    
    relevant_school = None
    max_ratings = 0
    
    for school_link in school_links:
        school_name_text = school_link.find("div", class_="SchoolCardHeader__StyledSchoolCardHeader-sc-1gq3qdv-0").get_text(strip=True)
        if school_name_text.lower() == school_name.lower():
            ratings_count = int(school_link.find("div", class_="CardNumRating__CardNumRatingCount-sc-17t4b9u-3").get_text(strip=True).split()[0])
            if ratings_count > max_ratings:
                max_ratings = ratings_count
                relevant_school = school_link
    
    if relevant_school:
        school_id = relevant_school["href"].split("/")[-1]
        return school_id
    else:
        raise ValueError(f"No relevant school found for name: {school_name}")
    
def scrape_professors_by_department(school_name, department_name):
    """
    Scrapes all professors for a specific department at the specified school from RateMyProfessor.
    """
    school_id = get_school_id(school_name)
    professors = []
    profs = 0
    url = f"{BASE_URL}/search/professors/{school_id}?q="
    driver.get(url)
    
    try:
         # Close the pop-up if it appears
        try:
            WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[text()='Close']"))
            ).click()
            print("Pop-up closed successfully.")
        except TimeoutException:
            print("Pop-up did not appear.")

        # Wait for the "Select..." dropdown to be interactable
        WebDriverWait(driver, 20).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "div.css-1wa3eu0-placeholder"))
        )
        # Click the "Select..." dropdown to show the department options
        select_placeholder = driver.find_element(By.CSS_SELECTOR, "div.css-1wa3eu0-placeholder")
        select_placeholder.click()

        # Wait until the dropdown menu is fully visible
        WebDriverWait(driver, 20).until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "div.css-1u8e7rt-menu"))
        )

        # Select the department
        department_options = driver.find_elements(By.CSS_SELECTOR, "div.css-1u8e7rt-menu")
        all_departments_text = department_options[0].text
        departments = all_departments_text.split("\n")

        # Find and click the desired department
        department_selected = False
        for dept in departments:
            if department_name.lower() in dept.lower():
                # Locate the specific department element and click it
                option_element = driver.find_element(By.XPATH, f"//div[text()='{dept}']")
                option_element.click()
                department_selected = True
                break

        if not department_selected:
            print(f"Department '{department_name}' not found in the list.")
            return []
        

        sleep(2)  # Small delay to ensure the page reloads with the filtered professors
        # Get the total number of professors in the department from the header
        total_professors_element = driver.find_element(By.CSS_SELECTOR, "h1[data-testid='pagination-header-main-results']")
        total_professors_text = total_professors_element.text.split()[0]  # Extract the number from the text
        total_professors = int(total_professors_text)
        
        # Calculate the number of times to click "Show More"
        clicks_required = math.ceil(total_professors / 8)

        # Click the "Show More" button the required number of times
        for _ in range(clicks_required):
            try:
                show_more_button = WebDriverWait(driver, 2).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[text()='Show More']"))
                )
                # Click the "Show More" button
                ActionChains(driver).move_to_element(show_more_button).click().perform()
                sleep(0.25)  # Small delay to ensure content loads
            except Exception as e:
                print(f"Error clicking 'Show More' button: {e}")
                break

        # After loading all professors, parse the page source with BeautifulSoup
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        professor_cards = soup.find_all("a", class_="TeacherCard__StyledTeacherCard-syjs0d-0 dLJIlx")

        # Process all loaded professor cards
        for card in professor_cards:
            name = card.find("div", class_="CardName__StyledCardName-sc-1gyrgim-0").get_text(strip=True)
        #    department = card.find("div", class_="CardSchool__Department-sc-19lmz2k-0").get_text(strip=True)
            rating = card.find("div", class_="CardNumRating__CardNumRatingNumber-sc-17t4b9u-2").get_text(strip=True)
            professor_url = BASE_URL + card["href"]
            num_ratings = card.find("div", class_="CardNumRating__CardNumRatingCount-sc-17t4b9u-3").get_text(strip=True)
            feedback_container = card.find("div", class_="CardFeedback__StyledCardFeedback-lq6nix-0 frciyA")
            would_take_again = feedback_container.find_all("div", class_="CardFeedback__CardFeedbackNumber-lq6nix-2 hroXqf")[0].get_text(strip=True)
            difficulty = feedback_container.find_all("div", class_="CardFeedback__CardFeedbackNumber-lq6nix-2 hroXqf")[1].get_text(strip=True)

            professors.append({
                "name": name,
        #        "department": department, FOR STORING DEPARTMENT
                "rating": rating,
                "ratings": num_ratings,
                "would take again": would_take_again,
                "difficulty": difficulty,
                "url": professor_url
            })
            profs+=1

    except TimeoutException as e:
        print(f"TimeoutException: {e}")
        print("Could not find the element within the specified timeout period.")
    
    return professors

# Example usage:
professors = scrape_professors_by_department("George Mason University", "Computer Science")
for prof in professors:
    print(prof)

driver.quit()
