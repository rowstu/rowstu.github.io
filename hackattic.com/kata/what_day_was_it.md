```
zimport datetime
from datetime import date,timedelta
import sys

def main():
    
    epoch = date(1970,1,1)
    input = (sys.stdin.read().split())

    for t in input:
        d = epoch + timedelta(days=int(t))
        # print(d)
        print(d.strftime('%A'))


if __name__ == "__main__":
    main()

```

* https://stackoverflow.com/questions/9847213/how-do-i-get-the-day-of-week-given-a-date
* https://docs.python.org/3/library/datetime.html#datetime.date.isoweekday
* https://stackoverflow.com/questions/6871016/adding-days-to-a-date-in-python
