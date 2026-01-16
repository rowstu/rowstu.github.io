first broken attempt
```
import sys

def main():
    input = (sys.stdin.read().split())

    char = ''
    word = ''
    
    for i in input:
        # print(i)
        
        count = 0
        
        # count the number of chars in the string
        
        if i == char:
            count += 1
        elif count >= 1 and char != i:
            word = count + i
        else:
            char = i
            count = 0
        
        print(word)
            
        
        # if the count is 1+x substitute the count and x
        # move on to next x

if __name__ == "__main__":
    main()

```
