import asyncio
import aiohttp
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from concurrent.futures import ThreadPoolExecutor
import math

BASE_URL = "https://www.ratemyprofessors.com"

# Setup Chrome options
chrome_options = Options()
chrome_options.add_argument("--headless")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")
chrome_options.add_argument("--disable-extensions")
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--disable-popup-blocking")
chrome_options.add_argument("--disable-images")

# Initialize the ChromeDriver with WebDriver Manager
webdriver_service = Service(ChromeDriverManager().install())

async def fetch(session, url):
    async with session.get(url) as response:
        return await response.text()

async def get_school_id(school_name):
    search_url = f"{BASE_URL}/search/schools?q={school_name}"
    async with aiohttp.ClientSession() as session:
        html = await fetch(session, search_url)
    
    soup = BeautifulSoup(html, 'html.parser')
    school_links = soup.find_all("a", class_="SchoolCard__StyledSchoolCard-sc-130cnkk-0")
    
    if not school_links:
        raise ValueError(f"Could not find school with name: {school_name}")
    
    relevant_school = max(school_links, key=lambda x: int(x.find("div", class_="CardNumRating__CardNumRatingCount-sc-17t4b9u-3").get_text(strip=True).split()[0]))
    return relevant_school["href"].split("/")[-1]

def parse_professor_card(card):
    name = card.find("div", class_="CardName__StyledCardName-sc-1gyrgim-0").get_text(strip=True)
    department = card.find("div", class_="CardSchool__Department-sc-19lmz2k-0").get_text(strip=True)
    rating = card.find("div", class_="CardNumRating__CardNumRatingNumber-sc-17t4b9u-2").get_text(strip=True)
    professor_url = BASE_URL + card["href"]
    num_ratings = card.find("div", class_="CardNumRating__CardNumRatingCount-sc-17t4b9u-3").get_text(strip=True)
    feedback_container = card.find("div", class_="CardFeedback__StyledCardFeedback-lq6nix-0 frciyA")
    would_take_again, difficulty = [div.get_text(strip=True) for div in feedback_container.find_all("div", class_="CardFeedback__CardFeedbackNumber-lq6nix-2 hroXqf")]

    return {
        "name": name,
        "department": department,
        "rating": rating,
        "ratings": num_ratings,
        "would-take-again": would_take_again,
        "difficulty": difficulty,
        "url": professor_url
    }

async def get_professor_details(session, professor, driver):
    if professor['ratings'] == '0 ratings' or not professor['ratings']:
        return None

    loop = asyncio.get_event_loop()
    
    # Run the Selenium operations in a thread pool
    await loop.run_in_executor(None, driver.get, professor['url'])

    courses = []
    try:
        dropdown = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "div.css-2b097c-container"))
        )
        dropdown.click()
        course_elements = driver.find_elements(By.CSS_SELECTOR, "div.css-d0tfi8-menu")
        course_lines = course_elements[0].text.split('\n')[1:]

        # Iterate over each line and split by space to extract the course code
        for line in course_lines:
            course_code = line.split(' ')
            if len(course_code) > 2:
                continue
            courses.append(course_code[0])
    except Exception as e:
        print(f"Error fetching courses for {professor['name']}: {e}")
    
    # Format courses-offered as a comma-separated string
    professor['courses-offered'] = ', '.join(courses)

    # Get reviews with bs4
    html = await fetch(session, professor['url'])
    soup = BeautifulSoup(html, 'html.parser')
    reviews = []
    try:
        review_elements = soup.select("li .Rating__RatingBody-sc-1rhvpxz-0")
        for i, review in enumerate(review_elements[:3], start=1):
            course = review.select_one('.RatingHeader__StyledClass-sc-1dlkqw1-3')
            date = review.select_one('.TimeStamp__StyledTimeStamp-sc-9q2r30-0')
            quality = review.select_one('.CardNumRating__CardNumRatingNumber-sc-17t4b9u-2')
            comment = review.select_one('.Comments__StyledComments-dzzyvm-0')

            reviews.append(
                f"course - {course.text.strip() if course else 'N/A'}, "
                f"date - {date.text.strip() if date else 'N/A'}, "
                f"quality - {quality.text.strip() if quality else 'N/A'}, "
                f"comment - {comment.text.strip() if comment else 'N/A'}"
            )
            
    except Exception as e:
        print(f"Error fetching reviews for {professor['name']}: {e}")
        
    professor['top-reviews'] = reviews
    return professor

async def scrape_professors_by_department(school_name, department_name):
    school_id = await get_school_id(school_name)
    url = f"{BASE_URL}/search/professors/{school_id}?q="

    driver = webdriver.Chrome(options=chrome_options, service=webdriver_service)
    try:    
        driver.get(url)

        try:
            WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.XPATH, "//button[text()='Close']"))).click()
        except:
            pass

        WebDriverWait(driver, 20).until(EC.element_to_be_clickable((By.CSS_SELECTOR, "div.css-1wa3eu0-placeholder"))).click()
        WebDriverWait(driver, 20).until(EC.visibility_of_element_located((By.CSS_SELECTOR, "div.css-1u8e7rt-menu")))

        departments = driver.find_element(By.CSS_SELECTOR, "div.css-1u8e7rt-menu").text.split("\n")
        
        department_selected = False
        for dept in departments:
            if department_name.lower() in dept.lower():
                driver.find_element(By.XPATH, f"//div[text()='{dept}']").click()
                department_selected = True
                break

        if not department_selected:
            print(f"Department '{department_name}' not found in the list.")
            return []

        await asyncio.sleep(2)

        total_professors = int(driver.find_element(By.CSS_SELECTOR, "h1[data-testid='pagination-header-main-results']").text.split()[0])
        clicks_required = math.ceil(total_professors / 8)

        async with aiohttp.ClientSession() as session:
            tasks = []
            processed_urls = set()

            for _ in range(clicks_required):
                soup = BeautifulSoup(driver.page_source, 'html.parser')
                professor_cards = soup.find_all("a", class_="TeacherCard__StyledTeacherCard-syjs0d-0 dLJIlx")
                
                for card in professor_cards:
                    professor = parse_professor_card(card)
                    if professor['url'] not in processed_urls:
                        processed_urls.add(professor['url'])
                        task = asyncio.create_task(get_professor_details(session, professor, driver))
                        tasks.append(task)

                try:
                    show_more_button = WebDriverWait(driver, 2).until(EC.element_to_be_clickable((By.XPATH, "//button[text()='Show More']")))
                    driver.execute_script("arguments[0].click();", show_more_button)
                    await asyncio.sleep(0.25)
                except:
                    break

            detailed_professors = await asyncio.gather(*tasks)

        return [prof for prof in detailed_professors if prof is not None]
    finally:
        driver.quit()


async def main():
    professors = await scrape_professors_by_department("George Mason University", "Computer Science")
    for prof in professors:
        print(prof)

if __name__ == "__main__":
    asyncio.run(main())

# Example usage:
'''professors = scrape_professors_by_department("George Mason University", "Computer Science")
for prof in professors:
    print(prof)
'''