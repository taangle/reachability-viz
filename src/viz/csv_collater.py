import csv
import sys
import os

FINAL_TIME = 10

if __name__ == "__main__":

    final_file_name = "data\\data{}.csv"

    for a in [str(n) for n in range(-9,2)]:
        with open(final_file_name.format(a), "w", newline="") as final:
            writer = csv.writer(final)
            writer.writerow(["initDist", "time", "e1", "e1dot"])
                
    for path, dirnames, files in os.walk("data\\"):
        if len(dirnames) == 0:
            path_elements = path.split("\\")
            dist = int(path_elements[1][1:])
            accel = int(path_elements[2][1:])

            data_file_name = files[0]

            with open(final_file_name.format(accel), "a", newline="") as final:
                writer = csv.writer(final)

                with open(path + "\\" + data_file_name, "r", newline="") as data:
                    reader = csv.reader(data)
                    for row in reader:
                        if row[0] != "time":
                            writer.writerow([dist, row[0], row[1], row[2]])
