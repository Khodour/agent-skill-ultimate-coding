const users = await Promise.all(ids.map(async (id) => db.findUser(id)));
