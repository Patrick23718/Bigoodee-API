const db = require("../models");
const stripe = require("stripe")(
  "sk_test_51JsMcWDHkYs3mdNXEYtAMkMWvdTSK4pDbu5QMKSI0lwhjydYtq2kEpPHEb6Fj1IQ0fZHvyDb6IfaNKV6bZL21XzL00NbItMEyI"
);
const Reservation = db.reservation;
const mongoose = require("mongoose");

exports.allAccess = (req, res) => {
  res.status(200).send("Public Content.");
};

exports.createReservation = (req, res) => {
  let data = {
    amount: 0,
    currency: "EUR",
    source: req.body.token,
    description: `Frais demandés pour des ${req.body.data.prestation.prestation.prestation}`,
  };
  if (req.body.data.reduction === null) {
    data.amount = req.body.data.prestation.tarif * 100;
  } else {
    data.amount =
      (req.body.data.prestation.tarif -
        (req.body.data.reduction.amount * req.body.data.prestation.tarif) /
          100) *
      100;
  }
  console.log(data);

  // console.log(req.body);
  let test = {
    cliente: req.userId,
    coiffeuse: req.body.data.prestation.uid,
    prestation: req.body.data.prestation._id,
    disponibilite: req.body.data.plage._id,
    date: req.body.data.date,
    reduction: "",
  };
  if (req.body.data.reduction === null) {
    test.reduction = null;
  } else {
    test.reduction = req.body.data.reduction._id;
  }
  const reservation = new Reservation(test);
  reservation
    .save()
    .then((reserve) => {
      console.log(reserve);
      stripe.charges
        .create(data)
        .then((charge) => {
          return res.status(200).json(charge);
        })
        .catch((err) => {
          console.log(err);
          res.send(err);
        });
    })
    .catch((err) => {
      console.log("add\n" + err);
      res.send(err);
    });

  return;
};

exports.getReservation = (req, res) => {
  Reservation.find({ cliente: req.userId })
    .populate([
      {
        path: "prestation",
        populate: [
          {
            path: "prestation",
          },
          {
            path: "uid",
          },
        ],
      },
      {
        path: "cliente",
      },
      {
        path: "disponibilite",
      },
      {
        path: "reduction",
      },
      {
        path: "coiffeuse",
      },
    ])
    .exec()
    .then((reserve) => {
      return res.status(200).json(reserve);
    })
    .catch((err) => {
      console.log(err);
      res.send(err);
    });
};

exports.getCoiffeuseReservation = (req, res) => {
  Reservation.find({
    coiffeuse: req.userId,
    $or: [{ status: "AWAIT" }, { status: "VALIDATE" }],
  })
    .populate([
      {
        path: "prestation",
        populate: [
          {
            path: "prestation",
          },
          {
            path: "uid",
          },
        ],
      },
      {
        path: "cliente",
      },
      {
        path: "disponibilite",
      },
      {
        path: "reduction",
      },
      {
        path: "coiffeuse",
      },
    ])
    .exec()
    .then((reserve) => {
      return res.status(200).json(reserve);
    })
    .catch((err) => {
      console.log(err);
      res.send(err);
    });
};

exports.updateReservationStatus = (req, res) => {
  let userData = {};

  userData.status = req.params.status;

  Reservation.updateOne(
    { coiffeuse: req.userId, _id: req.params.id },
    { $set: userData }
  )
    .exec()
    .then((resultat) => {
      if (!resultat)
        return res.status(404).json({
          message: "Oups!! aucune information pour l'identifiant fourni",
        });
      res.status(200).json({
        message: "Mise à jour reussie",
        doc: resultat,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        message: "Oups!! une erreur est survenue sur le serveur",
        error: err,
      });
    });
};

exports.getReservationByStatus = (req, res) => {
  Reservation.find({ coiffeuse: req.userId, status: req.params.status })
    .populate([
      {
        path: "prestation",
        populate: [
          {
            path: "prestation",
          },
          {
            path: "uid",
          },
        ],
      },
      {
        path: "cliente",
      },
      {
        path: "disponibilite",
      },
      {
        path: "reduction",
      },
      {
        path: "coiffeuse",
      },
    ])
    .exec()
    .then((reserve) => {
      return res.status(200).json(reserve);
    })
    .catch((err) => {
      console.log(err);
      res.send(err);
    });
};

exports.cancelReservation = (req, res) => {
  let userData = {};

  userData.status = "REFUSE";
  Reservation.updateOne({ _id: req.params.id }, { $set: userData })
    .exec()
    .then((resultat) => {
      if (!resultat)
        return res.status(404).json({
          message: "Oups!! aucune information pour l'identifiant fourni",
        });
      res.status(200).json({
        message: "Mise à jour reussie",
        doc: resultat,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        message: "Oups!! une erreur est survenue sur le serveur",
        error: err,
      });
    });
};

exports.adminGetReservationById = (req, res) => {
  const id = req.params.id;
  Reservation.findById(id)
    .populate([
      {
        path: "prestation",
        populate: [
          {
            path: "prestation",
          },
          {
            path: "uid",
          },
        ],
      },
      {
        path: "cliente",
      },
      {
        path: "disponibilite",
      },
      {
        path: "reduction",
      },
      {
        path: "coiffeuse",
      },
    ])
    .exec()
    .then((reserve) => {
      return res.status(200).json(reserve);
    })
    .catch((err) => {
      console.log(err);
      res.send(err);
    });
};

exports.adminGetReservation = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.limit) || 10;

  Reservation.find()
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .populate([
      {
        path: "prestation",
        populate: [
          {
            path: "prestation",
          },
          {
            path: "uid",
          },
        ],
      },
      {
        path: "cliente",
      },
      {
        path: "disponibilite",
      },
      {
        path: "reduction",
      },
      {
        path: "coiffeuse",
      },
    ])
    .exec()
    .then((reserve) => {
      return res.status(200).json({
        data: reserve,
        currentPage: page,
      });
    })
    .catch((err) => {
      console.log(err);
      res.send(err);
    });
};

exports.adminGetReservationStatus = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.limit) || 10;
  const ville = req.query.ville;
  const prenom = req.query.nom;

  Reservation.find({
    // $and: [
    //   { 'cliente.prenom': { $regex: ".*" + prenom + ".*", $options: "i" } },
    //   {
    //     $or: [{ status: "AWAIT" }, { nom: "VALIDATE" }],
    //   },
    //   { ville: { $regex: ".*" + ville + ".*", $options: "i" } },
    // ],
    $and: [
      { status: "AWAIT" },
      // { status: "VALIDATE" },
      // { "cliente.prenom": { $regex: ".*" + prenom + ".*", $options: "i" } },
    ],
    // { prenom: { $regex: ".*" + prenom + ".*", $options: "i" } },
    // { ville: { $regex: ".*" + ville + ".*", $options: "i" } },
  })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .populate([
      {
        path: "prestation",
        populate: [
          {
            path: "prestation",
          },
          {
            path: "uid",
          },
        ],
      },
      {
        path: "cliente",
        match: {
          prenom: { $regex: ".*" + prenom + ".*", $options: "i" },
          ville: { $regex: ".*" + ville + ".*", $options: "i" },
        },
      },
      {
        path: "disponibilite",
      },
      {
        path: "reduction",
      },
      {
        path: "coiffeuse",
      },
    ])
    .exec()
    .then((reserve) => {
      return res.status(200).json({
        data: reserve,
        currentPage: page,
      });
    })
    .catch((err) => {
      console.log(err);
      res.send(err);
    });
};

exports.updateReservationCoiffeuse = (req, res) => {
  let data = {};

  data.coiffeuse = req.body.coiffeuse;
  data.status = "AWAIT";
  const id = req.params.id;

  Reservation.update({ _id: id }, { $set: data })
    .exec()
    .then((resultat) => {
      if (!resultat)
        return res.status(404).json({
          message: "Oups!! aucune information pour l'identifiant fourni",
        });
      res.status(200).json({
        message: "Mise à jour reussie",
        doc: resultat,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        message: "Oups!! une erreur est survenue sur le serveur",
        error: err,
      });
    });
};

exports.adminGetReservationCoiffeuse = (req, res) => {
  const cid = mongoose.Types.ObjectId(req.params.id);
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.limit) || 10;

  Reservation.find({
    $and: [{ coiffeuse: cid }],
  })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .populate([
      {
        path: "prestation",
        populate: [
          {
            path: "prestation",
          },
          {
            path: "uid",
          },
        ],
      },
      {
        path: "cliente",
      },
      {
        path: "disponibilite",
      },
      {
        path: "reduction",
      },
      {
        path: "coiffeuse",
      },
    ])
    .exec()
    .then((reserve) => {
      return res.status(200).json({
        data: reserve,
        currentPage: page,
      });
    })
    .catch((err) => {
      console.log(err);
      res.send(err);
    });
};

exports.getAllClienteReserve = (req, res) => {
  Reservation.aggregate([
    { $group: { _id: { cliente: "$cliente", coiffeuse: "$coiffeuse" } } },
  ])
    .exec()
    .then((reserve) => {
      return res.status(200).json(reserve);
    })
    .catch((err) => {
      console.log(err);
      res.send(err);
    });
};
