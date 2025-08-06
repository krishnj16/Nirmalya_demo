import os
import exifread
import pandas as pd

def get_decimal_from_dms(dms, ref):
    degrees = dms[0].num / dms[0].den
    minutes = dms[1].num / dms[1].den
    seconds = dms[2].num / dms[2].den

    decimal = degrees + (minutes / 60.0) + (seconds / 3600.0)
    if ref in ['S', 'W']:
        decimal = -decimal
    return decimal

def extract_gps_info(photo_path):
    with open(photo_path, 'rb') as f:
        tags = exifread.process_file(f, stop_tag='GPSLatitude')

        lat = lon = None
        try:
            gps_latitude = tags['GPS GPSLatitude']
            gps_latitude_ref = tags['GPS GPSLatitudeRef'].printable
            gps_longitude = tags['GPS GPSLongitude']
            gps_longitude_ref = tags['GPS GPSLongitudeRef'].printable

            lat = get_decimal_from_dms(gps_latitude.values, gps_latitude_ref)
            lon = get_decimal_from_dms(gps_longitude.values, gps_longitude_ref)
        except KeyError:
            pass

    return lat, lon

def main(folder_path, output_excel):
    data = []

    for filename in os.listdir(folder_path):
        if filename.lower().endswith(('.jpg', '.jpeg')):
            file_path = os.path.join(folder_path, filename)
            lat, lon = extract_gps_info(file_path)
            data.append({'FileName': filename, 'Latitude': lat, 'Longitude': lon})

    df = pd.DataFrame(data)
    df.to_excel(output_excel, index=False)
    print(f"✅ GPS data extracted to: {output_excel}")

# Example usage:
photo_folder = r'path_to_your_photos'  # <-- Replace with your folder
output_excel_file = 'photo_gps_data.xlsx'
main(photo_folder, output_excel_file)
