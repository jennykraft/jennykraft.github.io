FROM ruby:3.2

# Install dependencies
RUN apt-get update -qq && apt-get install -y \
    build-essential libssl-dev zlib1g-dev nodejs npm

# Install Jekyll and Bundler
RUN gem install bundler jekyll

# Create app directory
WORKDIR /srv/jekyll

# Copy project files
COPY . .

# Install Jekyll dependencies
RUN bundle install

# Expose default Jekyll port
EXPOSE 4000

CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0"]
