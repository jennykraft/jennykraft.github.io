FROM ruby:3.2
RUN apt-get update -qq && apt-get install -y \
    build-essential libssl-dev zlib1g-dev nodejs npm
RUN gem install bundler jekyll
WORKDIR /srv/jekyll
COPY . .
RUN bundle install
EXPOSE 4000
CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0"]
