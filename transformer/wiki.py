from datasets import load_dataset

dataset = load_dataset("wikipedia", "20220301.simple", trust_remote_code=True)

# Extract all article text into one big string
text = "\n".join(dataset["train"]["text"])

# Save to file
with open("dataset.txt", "w", encoding="utf-8") as f:
    f.write(text)

print(f"Total characters: {len(text):,}")
