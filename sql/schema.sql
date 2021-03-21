CREATE TABLE IF NOT EXISTS series(
  id int not null unique primary key,
  name varchar(128) not null,
  air_date timestamp with time zone,
  in_production boolean,
  tagline text,
  image text not null,
  description text,
  language varchar(2) not null,
  network text,
  url text
);

CREATE TABLE IF NOT EXISTS genres(
    id serial primary key,
    name text not null
);

CREATE TABLE IF NOT EXISTS series_genres(
    id serial primary key,
    serie_id int not null,
    genre_id int not null,
    constraint fk_series foreign key(serie_id) references series(id),
    constraint fk_genres foreign key(genre_id) references genres(id)
);

CREATE TABLE IF NOT EXISTS seasons(
    id serial primary key,
    name varchar(128) not null,
    number int not null check (number > 0),
    air_date timestamp with time zone,
    overview text,
    poster text not null,
    serie_id int not null,
    constraint fk_series foreign key(serie_id) references series(id)
);

CREATE TABLE IF NOT EXISTS episodes(
    id serial primary key,
    name varchar(128) not null,
    number int not null check (number > 0),
    air_date timestamp with time zone,
    overview text,
    season_number int not null,
    series_id int not null,
    -- constraint fk_seasons foreign key(season_number) references seasons(number), --number??
    constraint fk_series foreign key(series_id) references series(id)
);

CREATE TABLE IF NOT EXISTS users(
    id serial primary key,
    username character varying(255) UNIQUE NOT NULL,
    email varchar(50) not null unique,
    password character varying(255) NOT NULL,
    admin boolean default false,
    created timestamp default current_timestamp,
    updated timestamp default current_timestamp
);

--ATH: setja dummy gögn fyrir þessa töflu
CREATE TABLE IF NOT EXISTS users_series(
    id serial primary key,
    serie_id int not null,
    user_id int not null,
    state varchar(20) check (state IN ('Langar að horfa', 'Er að horfa', 'Hef horft')),
    rate int check (rate > -1 AND rate < 6),
    constraint fk_series foreign key(serie_id) references series(id),
    constraint fk_users foreign key(user_id) references users(id)
);

INSERT INTO users (username, email, password, admin) VALUES ('admin', 'admin@admin.is', '$2a$11$pgj3.zySyFOvIQEpD7W6Aund1Tw.BFarXxgLJxLbrzIv/4Nteisii', true);
INSERT INTO users (username, email, password, admin) VALUES ('jon', 'jon@jon.is', '$2a$11$pgj3.zySyFOvIQEpD7W6Aund1Tw.BFarXxgLJxLbrzIv/4Nteisii', false);
