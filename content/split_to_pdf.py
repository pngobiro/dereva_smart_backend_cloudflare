import os
from pypdf import PdfReader, PdfWriter

def split_and_merge_to_pdf(pdf_path, output_dir):
    # Create the output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Define page ranges based on the document's structure.
    # Format: (Start Page, End Page) -> End page is where the NEXT chapter starts.
    common_range = (10, 19) # Chapter 1: Common Core Units
    
    categories = {
        "Category_A_Motorcycles": (19, 25),
        "Category_B_Light_Vehicles": (25, 30),
        "Category_B_Professional_PLV": (30, 45),
        "Category_D_Public_Service_PSV": (45, 54),
        "Category_A3_Motorcycle_Taxi": (54, 61),
        "Category_C_Truck_Drivers": (61, 83),
        "Category_E_Special_Professional": (83, 98),
        "Category_G_Industrial_Agri_ICA": (98, 103)
    }

    try:
        reader = PdfReader(pdf_path)
        total_pages = len(reader.pages)
        print(f"Loaded '{pdf_path}' with {total_pages} pages.\n")

        for category_name, (start, end) in categories.items():
            print(f"Generating PDF for {category_name}...")
            writer = PdfWriter()

            # 1. Add Common Core Units pages (Pages 10 to 18)
            # We subtract 1 because Python uses 0-based indexing (Page 1 = Index 0)
            for page_num in range(common_range[0] - 1, min(common_range[1] - 1, total_pages)):
                writer.add_page(reader.pages[page_num])

            # 2. Add Specific Category Units pages
            for page_num in range(start - 1, min(end - 1, total_pages)):
                writer.add_page(reader.pages[page_num])

            # Save to a new PDF file
            output_filepath = os.path.join(output_dir, f"{category_name}.pdf")
            with open(output_filepath, 'wb') as out_file:
                writer.write(out_file)
                
            print(f" -> Successfully saved: {output_filepath}")
            
    except FileNotFoundError:
        print(f"Error: The file '{pdf_path}' was not found. Please check the file name and path.")
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    # --- CONFIGURATION ---
    # Put the exact name of your source PDF file here
    INPUT_PDF = "New Driving Curriculum Ntsa.pdf" 
    
    # Folder where the new PDFs will be saved
    OUTPUT_FOLDER = "Categorized_License_PDFs"
    
    print("Starting PDF separation process...\n")
    split_and_merge_to_pdf(INPUT_PDF, OUTPUT_FOLDER)
    print("\nDone! All customized category PDFs are ready.")