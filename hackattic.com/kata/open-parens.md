```
import sys

def main():
    
    input = (sys.stdin.read().split())
    for t in input:
        left = t.count("(")
        right = t.count(")")
            
        if left == right:
            print("yes")
        else:
            print("no")

if __name__ == "__main__":
    main()
```

Every line you read in from STDIN will contain a bunch of parentheses.

Your task is to determine if they are properly nested – i.e. if every opening parenthesis has a closing one.

Sample input

(())

()))

(()((())))

(()(()(()))

Sample output

yes

no

yes

no
